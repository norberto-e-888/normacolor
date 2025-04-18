"use client";

import { CheckCircle2, Upload, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOYALTY_TIER_CONFIG, UserLoyaltyTier } from "@/database";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    totalLoyaltyPoints: 0,
    unspentLoyaltyPoints: 0,
    loyaltyTier: UserLoyaltyTier.Bronze,
    tierQualificationSpendCents: 0,
    profilePicture: "",
    profileCompletionFlags: {
      nameAdded: false,
      phoneAdded: false,
      profilePictureAdded: false,
    },
  });

  // Fetch profile data
  useEffect(() => {
    async function fetchProfileData() {
      setLoading(true);
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        } else {
          toast.error("Error loading profile data");
        }
      } catch (error) {
        toast.error("Error loading profile data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchProfileData();
    }
  }, [session?.user]);

  // Save profile data
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phoneNumber: profileData.phoneNumber,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData({
          ...profileData,
          ...data.user,
        });

        // Show points awarded notification if any
        if (data.pointsAwarded > 0) {
          toast.success(`¡Has ganado ${data.pointsAwarded} puntos!`);
        } else {
          toast.success("Perfil actualizado");
        }

        // Update session to reflect changes
        await update();
      } else {
        toast.error("Error updating profile");
      }
    } catch (error) {
      toast.error("Error updating profile");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Upload profile picture
  const handleProfilePictureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await fetch("/api/user/profile-picture", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData({
          ...profileData,
          profilePicture: data.profilePicture,
          totalLoyaltyPoints: data.totalPoints,
          unspentLoyaltyPoints: data.unspentPoints,
          profileCompletionFlags: {
            ...profileData.profileCompletionFlags,
            profilePictureAdded: true,
          },
        });

        // Show points awarded notification if any
        if (data.pointsAwarded > 0) {
          toast.success(`¡Has ganado ${data.pointsAwarded} puntos!`);
        } else {
          toast.success("Foto de perfil actualizada");
        }

        // Update session to reflect changes
        await update();
      } else {
        toast.error("Error uploading profile picture");
      }
    } catch (error) {
      toast.error("Error uploading profile picture");
      console.error(error);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Calculate tier progress
  const calculateTierProgress = () => {
    const currentTier = profileData.loyaltyTier;

    // Handle gold tier (max tier)
    if (currentTier === UserLoyaltyTier.Gold) {
      return 100;
    }

    // Determine next tier
    const nextTier =
      currentTier === UserLoyaltyTier.Bronze
        ? UserLoyaltyTier.Silver
        : UserLoyaltyTier.Gold;

    // Calculate current spend vs requirement
    const spentAmount = profileData.tierQualificationSpendCents;
    const requirement = LOYALTY_TIER_CONFIG[nextTier].spendingRequirement;

    // Calculate progress percentage (cap at 100%)
    return Math.min(Math.round((spentAmount / requirement) * 100), 100);
  };

  // Calculate points per dollar
  const pointsPerDollar =
    LOYALTY_TIER_CONFIG[profileData.loyaltyTier].pointsMultiplier;

  // Progress percentage
  const tierProgress = calculateTierProgress();

  // Determine next tier
  const getNextTier = () => {
    if (profileData.loyaltyTier === UserLoyaltyTier.Gold) {
      return null; // No next tier
    }
    return profileData.loyaltyTier === UserLoyaltyTier.Bronze
      ? UserLoyaltyTier.Silver
      : UserLoyaltyTier.Gold;
  };

  const nextTier = getNextTier();

  // Remaining spend for next tier
  const calculateRemainingSpend = () => {
    if (!nextTier) return 0;

    const requirement = LOYALTY_TIER_CONFIG[nextTier].spendingRequirement;
    const remaining = requirement - profileData.tierQualificationSpendCents;
    return Math.max(0, remaining);
  };

  const remainingSpendDollars = (calculateRemainingSpend() / 100).toFixed(2);

  // Profile completion progress
  const completedTasks = Object.values(
    profileData.profileCompletionFlags
  ).filter(Boolean).length;
  const totalTasks = Object.keys(profileData.profileCompletionFlags).length;
  const profileCompletionPercentage = Math.round(
    (completedTasks / totalTasks) * 100
  );

  return (
    <div className="container p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column - Profile Info */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    {profileData.profilePicture ? (
                      <AvatarImage
                        src={profileData.profilePicture}
                        alt="Profile picture"
                      />
                    ) : (
                      <AvatarFallback>
                        <User size={40} />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    ) : (
                      <Upload size={14} />
                    )}
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleProfilePictureUpload}
                    disabled={uploading}
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">
                    {profileData.firstName
                      ? `${profileData.firstName} ${profileData.lastName}`
                      : "Completa tu perfil"}
                  </h2>
                  <p className="text-muted-foreground">
                    Nivel:{" "}
                    <span className="font-medium">
                      {profileData.loyaltyTier}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Puntos disponibles:{" "}
                    <span className="font-medium">
                      {profileData.unspentLoyaltyPoints}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nombre</Label>
                    <div className="relative mt-1">
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            firstName: e.target.value,
                          })
                        }
                        placeholder="Tu nombre"
                      />
                      {profileData.profileCompletionFlags.nameAdded && (
                        <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 h-4 w-4" />
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          lastName: e.target.value,
                        })
                      }
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Teléfono</Label>
                  <div className="relative mt-1">
                    <Input
                      id="phoneNumber"
                      value={profileData.phoneNumber}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phoneNumber: e.target.value,
                        })
                      }
                      placeholder="Tu número de teléfono"
                    />
                    {profileData.profileCompletionFlags.phoneAdded && (
                      <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 h-4 w-4" />
                    )}
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={saving}
                  onClick={handleSave}
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Guardando...
                    </div>
                  ) : (
                    "Guardar cambios"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right column - Loyalty stats */}
          <div className="space-y-6">
            {/* Profile Completion Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold mb-4">Completar Perfil</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">
                      Progreso
                    </span>
                    <span className="text-sm font-medium">
                      {profileCompletionPercentage}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-primary rounded-full"
                      style={{ width: `${profileCompletionPercentage}%` }}
                    />
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    {profileData.profileCompletionFlags.nameAdded ? (
                      <CheckCircle2 className="text-green-500 h-4 w-4" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-gray-300" />
                    )}
                    <span>Agrega tu nombre (+1,000 puntos)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    {profileData.profileCompletionFlags.phoneAdded ? (
                      <CheckCircle2 className="text-green-500 h-4 w-4" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-gray-300" />
                    )}
                    <span>Agrega tu teléfono (+1,000 puntos)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    {profileData.profileCompletionFlags.profilePictureAdded ? (
                      <CheckCircle2 className="text-green-500 h-4 w-4" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-gray-300" />
                    )}
                    <span>Agrega una foto de perfil (+1,000 puntos)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Tier Progress Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold mb-4">Nivel de Lealtad</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">
                      {profileData.loyaltyTier}
                    </span>
                    {nextTier && (
                      <span className="text-sm font-medium">{nextTier}</span>
                    )}
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-primary rounded-full"
                      style={{ width: `${tierProgress}%` }}
                    />
                  </div>
                </div>

                {nextTier ? (
                  <p className="text-sm text-muted-foreground">
                    Te faltan ${remainingSpendDollars} para alcanzar el nivel{" "}
                    {nextTier}.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    ¡Has alcanzado el nivel máximo!
                  </p>
                )}

                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-1">
                    Beneficios actuales:
                  </p>
                  <p className="text-sm font-medium">
                    {pointsPerDollar}x puntos por cada dólar gastado
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
