"use client";

import { PSDRenderer } from "./psd-renderer";

const PSD_URL =
  "https://normacolor-staging.s3.us-east-1.amazonaws.com/letterhead_21.psd?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KNWWGMRUJH6HUE5%2F20241018%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20241018T183801Z&X-Amz-Expires=86400&X-Amz-Signature=22076f08462e1f10982b1a4fdcb04a893a2d11546aaa8ab5e21ada980c261af3&X-Amz-SignedHeaders=host&x-id=GetObject";

export default function AdminArtsPage() {
  return (
    <div>
      <PSDRenderer psdUrl={PSD_URL} />
    </div>
  );
}
