"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { toast } from "sonner";
import { MdEdit, MdLogout, MdEmail, MdPhotoCamera, MdSave, MdClose, MdPerson } from "react-icons/md";
import EmojiProfiles from "@/components/ui/cartoonvector";
import Image from "next/image";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [changename, setChangeName] = useState(false);
  const [userEmoji, setUserEmoji] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    fetch(`/api/profile?email=${encodeURIComponent(user.email)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.profileImage) setProfileImageUrl(data.profileImage);
        if (data.emoji) setUserEmoji(data.emoji);
      })
      .catch(console.error);
  }, [user?.email]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.displayName) setDisplayName(currentUser.displayName);
    });
    return () => unsubscribe();
  }, []);

  const uploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        try {
          const res = await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email, profileImage: dataUrl }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to save to database");
          }
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleUpdate = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      if (profileImage) {
        toast.info("Uploading image...");
        const newImageUrl = await uploadImage(profileImage);
        setProfileImageUrl(newImageUrl);
        window.dispatchEvent(new Event("profileUpdated"));
      }

      if (userEmoji !== null) {
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, emoji: userEmoji }),
        });
        if (!res.ok) throw new Error("Failed to save emoji");
        window.dispatchEvent(new Event("profileUpdated"));
      }

      await updateProfile(user, { displayName });
      await user.reload();
      setUser({ ...auth.currentUser });
      setChangeName(false);
      setProfileImage(null);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Update failed!");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    toast.success("Signed out successfully");
    window.location.href = "/";
  };

  const removeImage = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, profileImage: null }),
      });
      if (!res.ok) throw new Error("Failed to remove image");
      setProfileImageUrl(null);
      window.dispatchEvent(new Event("profileUpdated"));
      toast.success("Profile image removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove image");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-950">
      <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0f111a] font-serif relative overflow-hidden text-gray-200">
      {/* Background Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 py-12 relative z-10 flex flex-col lg:flex-row gap-8">

        {/* Left Column - Profile Summary */}
        <div className="w-full lg:w-1/3 flex flex-col items-center">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 w-full flex flex-col items-center text-center shadow-2xl">

            <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-full border-4 border-sky-500/30 overflow-hidden shadow-xl shadow-sky-500/20 flex items-center justify-center bg-gray-800 transition-all duration-300 group-hover:border-sky-400">
                {profileImage ? (
                  <Image src={URL.createObjectURL(profileImage)} alt="preview" width={128} height={128} className="object-cover w-full h-full" />
                ) : profileImageUrl ? (
                  <Image src={profileImageUrl} alt="profile" width={128} height={128} className="object-cover w-full h-full" priority />
                ) : userEmoji ? (
                  <Image src={userEmoji} alt="avatar" width={128} height={128} className="object-cover w-full h-full" priority />
                ) : (
                  <MdPerson className="text-6xl text-gray-500" />
                )}
              </div>

              {/* Quick Image Upload Button overlay */}
              <label className="absolute bottom-0 right-0 p-3 bg-sky-500 hover:bg-sky-400 text-white rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110">
                <MdPhotoCamera size={18} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProfileImage(file);
                      setChangeName(true); // Open edit mode to save
                    }
                  }}
                />
              </label>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">{user.displayName || "Unknown User"}</h2>
            <div className="flex items-center gap-2 text-gray-400 text-sm bg-black/20 px-4 py-2 rounded-full">
              <MdEmail className="text-sky-400" />
              <span>{user.email}</span>
            </div>

            <div className="w-full h-px bg-white/10 my-6" />

            <div className="w-full space-y-3">
              <button
                onClick={() => setChangeName(!changename)}
                className="w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-white"
              >
                {changename ? <><MdClose /> Cancel Edit</> : <><MdEdit /> Edit Profile</>}
              </button>

              <button
                onClick={handleSignOut}
                className="w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40"
              >
                <MdLogout /> Sign Out
              </button>
            </div>

          </div>
        </div>

        {/* Right Column - Edit Form */}
        <div className="w-full lg:w-2/3">
          {changename ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MdEdit className="text-sky-400" />
                Update Your Details
              </h3>

              <div className="space-y-6">
                {/* Name Input */}
                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl p-3.5 outline-none text-white transition-all"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-2">Profile Image</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 px-5 py-3 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-xl cursor-pointer transition-all">
                      <MdPhotoCamera size={18} />
                      <span className="text-sm font-medium">{profileImage ? profileImage.name : "Select Image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>

                    {profileImage && (
                      <button
                        onClick={() => setProfileImage(null)}
                        className="px-4 py-3 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                      >
                        Clear Selection
                      </button>
                    )}

                    {profileImageUrl && !profileImage && (
                      <button
                        onClick={removeImage}
                        disabled={saving}
                        className="px-4 py-3 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors"
                      >
                        Remove Current Image
                      </button>
                    )}
                  </div>
                </div>

                {/* Avatar Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-3">Or Choose an Avatar</label>
                  <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                    <EmojiProfiles setUserEmoji={setUserEmoji} userEmogi={userEmoji} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 mt-6 border-t border-white/10">
                  <button
                    onClick={() => {
                      setChangeName(false);
                      setProfileImage(null);
                    }}
                    className="flex-1 py-3.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="flex-1 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><MdSave size={18} /> Save Changes</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-500 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
              <MdPerson size={64} className="text-gray-700 mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">Your Profile Dashboard</h3>
              <p className="max-w-sm">Keep your details up to date to personalize your experience across the platform.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
