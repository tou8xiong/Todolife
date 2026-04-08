"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { toast } from "sonner";
import { FaEdit, FaSignOutAlt, FaEnvelope, FaCamera } from "react-icons/fa";
import EmojiProfiles from "@/components/ui/cartoonvector";
import Image from "next/image";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [changename, setChangeName] = useState(false);
  const [userEmoji, setUserEmoji] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  // Load profile from Redis once the user is known
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

  const handleUpdate = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }
    try {
      if (profileImage) {
        toast.info("Processing image...");
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email, profileImage: dataUrl }),
          });
          setProfileImageUrl(dataUrl);
          toast.success("Image saved!");
          window.dispatchEvent(new Event("profileUpdated"));
        };
        reader.readAsDataURL(profileImage);
      }

      if (userEmoji !== null) {
        await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, emoji: userEmoji }),
        });
        window.dispatchEvent(new Event("profileUpdated"));
      }

      await updateProfile(user, { displayName });
      await user.reload();
      setUser({ ...auth.currentUser });
      setChangeName(false);
      setProfileImage(null);
      toast.success("Profile updated!");
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error("Update failed! " + error.message);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    toast.success("Signed out!");
    window.location.href = "/";
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100">
      <p className="text-gray-500 font-serif text-lg">Please log in to view your profile.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 font-serif pb-12">

      {/* Banner */}
      <div className="relative h-44 bg-gradient-to-r from-blue-500 to-sky-400 rounded-b-3xl shadow-lg">
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2">
          <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-amber-100 flex items-center justify-center">
            {profileImageUrl ? (
              <Image src={profileImageUrl} alt="profile" width={112} height={112} className="object-cover" priority />
            ) : userEmoji ? (
              <Image src={userEmoji} alt="avatar" width={112} height={112} className="object-cover" priority />
            ) : (
              <span className="text-5xl font-bold text-blue-600">
                {(user.displayName || user.email || "U")[0].toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-20 px-4 max-w-lg mx-auto space-y-4">

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">{user.displayName || "No name set"}</h2>
          <div className="flex items-center justify-center gap-1 text-gray-500 mt-1 text-sm">
            <FaEnvelope size={12} />
            <span>{user.email}</span>
          </div>
          <button
            onClick={() => setChangeName(!changename)}
            className="mt-4 px-5 py-1.5 text-sm bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-full inline-flex items-center gap-1.5 transition"
          >
            <FaEdit size={12} />
            {changename ? "Close Editor" : "Edit Profile"}
          </button>
        </div>

        {/* Edit Panel */}
        {changename && (
          <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-700">Edit Profile</h3>

            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border-2 border-sky-200 focus:border-sky-400 rounded-xl p-2.5 outline-none text-gray-800 transition"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Profile Image</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                  className="hidden"
                  id="profile-image"
                />
                <label
                  htmlFor="profile-image"
                  className="flex items-center gap-2 px-4 py-2 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-xl cursor-pointer transition"
                >
                  <FaCamera size={14} />
                  {profileImage ? profileImage.name : "Choose Image"}
                </label>
                {profileImage && (
                  <button
                    onClick={() => setProfileImage(null)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
                {profileImageUrl && !profileImage && (
                  <button
                    onClick={async () => {
                      await fetch("/api/profile", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: user.email, profileImage: null }),
                      });
                      setProfileImageUrl(null);
                      window.dispatchEvent(new Event("profileUpdated"));
                      toast.success("Profile image removed!");
                    }}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove Current Image
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">Choose Avatar</label>
              <EmojiProfiles setUserEmoji={setUserEmoji} userEmogi={userEmoji} />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setChangeName(false)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Sign Out Card */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <button
            onClick={handleSignOut}
            className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 font-semibold flex items-center justify-center gap-2 transition"
          >
            <FaSignOutAlt size={15} />
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}
