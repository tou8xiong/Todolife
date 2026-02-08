"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, reload, signOut, updateProfile } from "firebase/auth";
import { FaEdit } from "react-icons/fa";
import EmojiProfiles from "@/component/foldercetor/cartoonvector";
import Image from "next/image";
import { text } from "stream/consumers";

interface Task {
  em: string;
}



export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [changename, setChangeName] = useState(false);
  const [userEmoji, setUserEmoji] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("emoji");
    if (saved) {
      setUserEmoji(saved);
    }

  }, []);

  useEffect(() => {
    if (userEmoji !== null) {
      localStorage.setItem("emoji", userEmoji);
    }
  }, [userEmoji]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.displayName) setDisplayName(currentUser.displayName);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdate = async () => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName });
      await user.reload();
      const updatedUser = auth.currentUser;
      setUser(updatedUser);
      setChangeName(false);
      alert("✅ Profile updated!");
    } catch (error) {
      console.error("Update error:", error);
      alert("Update failed! Try agian leter");
    }
  };
  const handleSignOut = async () => {
    await signOut(auth);
    window.location.href = "/";
    alert("Signed out!");
  };
  if (!user) return <p>Please log in</p>;

  const handleChangeName = () => {
    setChangeName(!changename);
  }


  return (
    <div className="p-6 text-center">
      <div>
        <div>
          <h1 className="text-2xl font-bold font-mono"> Profile</h1>
          {userEmoji ? (<div className=" flex justify-center"><Image src={userEmoji} alt="useremoji" width={100} height={100} priority /></div>) : ("")}
          <p>Email: {user.email}</p>
          <p className="">
            Name: {user.displayName || "No name set"}
            <button onClick={handleChangeName} className="cursor-pointer ml-22"><FaEdit size={16} /></button></p>
        </div>
        {changename && <div className="sm:mx-50 sm:ml-60 md:mx50 md:ml-60">
          <div className=" pb-20 rounded-xl bg-amber-100 flex flex-col shadow-xl gap-7">
            <div className="flex flex-col justify-center items-center g">
              <label>Your new name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="border p-2 rounded "
                placeholder="Your name" />
            </div>
            <div>
              <label>Choose your emogi</label>
              <EmojiProfiles setUserEmoji={setUserEmoji} userEmogi={userEmoji} />
            </div>
          </div>
          <button onClick={handleUpdate} className="bg-blue-500 cursor-pointer text-white px-10 py-2 rounded">Update</button>
        </div>}
        <div className="mt-10 flex justify-center gap-2">
          <button onClick={handleSignOut} className="bg-red-400 cursor-pointer text-white px-3  py-1 rounded">Sign out</button>
        </div>
      </div>
    </div>
  );
}