import React, { useContext, useEffect, useRef } from "react";
import { CallContext } from "../../context/CallContext";
import { AuthContext } from "../../context/AuthContext";
import assets from "../assets/assets";

function CallManager() {
  const { callState, acceptIncomingCall, declineIncomingCall, terminateCall } = useContext(CallContext);
  const { authUser } = useContext(AuthContext);
  const jitsiContainerRef = useRef(null);

  useEffect(() => {
    if (callState.status !== "active" || !callState.room) return;

    // Load Jitsi API
    const domain = "meet.jit.si";
    const options = {
      roomName: callState.room,
      width: "100%",
      height: "100%",
      parentNode: jitsiContainerRef.current,
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: false, // Skip prejoin page for direct call feel
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
      },
      userInfo: {
        displayName: authUser?.fullName || "User",
      },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);

    // When call ends or user leaves the Jitsi room
    api.addEventListener("videoConferenceLeft", () => {
      terminateCall();
    });

    return () => {
      api.dispose();
    };
  }, [callState.status, callState.room, authUser]);

  if (callState.status === "idle") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md text-white">
      {/* Dialing Screen */}
      {callState.status === "dialing" && (
        <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-[#1e1b36] border border-gray-700 shadow-2xl w-full max-w-sm text-center">
          <div className="relative flex items-center justify-center">
            {/* Ringing waves */}
            <span className="absolute inline-flex h-24 w-24 rounded-full bg-purple-500/20 animate-ping"></span>
            <img
              src={callState.participant?.profilePic || assets.avatar_icon}
              alt=""
              className="w-20 h-20 rounded-full object-cover border-4 border-purple-500 z-10"
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">{callState.participant?.fullName || "User"}</h2>
            <p className="text-sm text-purple-300">Calling...</p>
          </div>
          <button
            onClick={terminateCall}
            className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
          >
            {/* Red phone hanging up */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white transform rotate-[135deg]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.158-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </button>
        </div>
      )}

      {/* Ringing Screen */}
      {callState.status === "ringing" && (
        <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-[#1e1b36] border border-gray-700 shadow-2xl w-full max-w-sm text-center">
          <div className="relative flex items-center justify-center">
            {/* Ringing waves */}
            <span className="absolute inline-flex h-24 w-24 rounded-full bg-green-500/20 animate-ping"></span>
            <img
              src={callState.participant?.profilePic || assets.avatar_icon}
              alt=""
              className="w-20 h-20 rounded-full object-cover border-4 border-green-500 z-10"
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">{callState.participant?.fullName || "User"}</h2>
            <p className="text-sm text-green-300">Incoming Video Call...</p>
          </div>
          <div className="flex gap-8 mt-2">
            {/* Accept */}
            <button
              onClick={acceptIncomingCall}
              className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.158-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </button>
            {/* Decline */}
            <button
              onClick={declineIncomingCall}
              className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white transform rotate-[135deg]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.158-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Active Call (Jitsi Prebuilt) Screen */}
      {callState.status === "active" && (
        <div className="relative w-full h-full flex flex-col bg-[#161229]">
          <div className="flex justify-between items-center px-6 py-4 bg-[#1e1b36] border-b border-gray-700/50">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse"></span>
              In Call: {callState.participant?.fullName || "Group Call"}
            </h2>
            <button
              onClick={terminateCall}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-sm font-semibold rounded-lg shadow-lg cursor-pointer transition-colors"
            >
              End Call
            </button>
          </div>
          {/* Host of Jitsi Frame */}
          <div ref={jitsiContainerRef} className="flex-1 w-full bg-black"></div>
        </div>
      )}
    </div>
  );
}

export default CallManager;
