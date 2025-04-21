import { NextResponse } from "next/server";

import { Order, OrderStatus, UserRole } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { DesignerChat } from "@/lib/server/designer-chat";

export async function POST(
  request: Request,
  { params }: { params: { orderId: string; itemId: string } }
) {
  try {
    const session = (await getServerSession()) as ExtendedSession;
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { imageId } = await request.json();

    if (!imageId) {
      return new NextResponse("Image ID is required", { status: 400 });
    }

    await connectToMongo();
    const order = await Order.findById(params.orderId);

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Only allow the customer to approve art
    if (
      session.user.role !== UserRole.Admin &&
      order.customerId.toString() !== session.user.id
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find the order item
    const orderItemIndex = order.cart.findIndex(
      (item) => item.id === params.itemId
    );

    if (orderItemIndex === -1) {
      return new NextResponse("Order item not found", { status: 404 });
    }

    // Verify the image exists in the chat
    const images = await DesignerChat.getImages(params.itemId);
    const designerImages = images.designerImages || [];

    if (!designerImages.includes(imageId)) {
      return new NextResponse("Image not found", { status: 404 });
    }

    // Update the order item with the approved art ID
    const orderItem = order.cart[orderItemIndex];
    // @ts-expect-error - The schema has been updated with approvedArtId but TypeScript doesn't know it yet
    orderItem.approvedArtId = imageId;

    // If order is in DesignApprovalPending status, also update it to InProgress
    if (order.status === OrderStatus.DesignApprovalPending) {
      order.status = OrderStatus.InProgress;
    }

    await order.save();

    return NextResponse.json({
      success: true,
      updatedOrder: {
        ...order.toObject(),
        id: order._id.toString(),
        _id: undefined,
        cart: order.cart.map((item) => ({
          ...item.toObject(),
          id: item._id.toString(),
          _id: undefined,
        })),
      },
    });
  } catch (error) {
    console.error("Error approving art:", error);
    return new NextResponse(
      `Failed to approve art: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { status: 500 }
    );
  }
}
