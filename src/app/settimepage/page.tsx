import type { Metadata } from "next";
import TimeSetting from "@/components/timer/TimerSettings";

export const metadata: Metadata = {
  title: "Study Timer",
  description: "Use the TodoLife study timer to boost focus and track your sessions. Set custom durations and stay productive.",
};

export default function SetTimePage(){
    return(
        <div className="flex justify-center">
        <TimeSetting />
        </div>
    )
}