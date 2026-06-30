import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const CallContext = createContext();

export const CallProvider = ({children}) => {
    const {authUser, socket} = useContext(AuthContext)
    
    // Video call state
    const [callState, setCallState] = useState({
        status: "idle", // idle, dialing, ringing, active
        room: null,
        participant: null
    });

    // Video Call Handlers
    const initiateCall = (targetUser) => {
        if (!socket) return;
        const generatedRoom = `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        setCallState({
            status: "dialing",
            room: generatedRoom,
            participant: targetUser
        });
        socket.emit("callUser", {
            from: { _id: authUser._id, fullName: authUser.fullName, profilePic: authUser.profilePic },
            to: targetUser._id,
            roomId: generatedRoom
        });
    };

    const acceptIncomingCall = () => {
        if (!socket || !callState.room || !callState.participant) return;
        socket.emit("acceptCall", {
            to: callState.participant._id,
            roomId: callState.room
        });
        setCallState(prev => ({ ...prev, status: "active" }));
    };

    const declineIncomingCall = () => {
        if (!socket || !callState.participant) return;
        socket.emit("declineCall", { to: callState.participant._id });
        setCallState({ status: "idle", room: null, participant: null });
    };

    const terminateCall = () => {
        if (!socket) return;
        if (callState.participant && !callState.participant.isGroup) {
            socket.emit("endCall", { to: callState.participant._id });
        }
        setCallState({ status: "idle", room: null, participant: null });
    };

    const joinGroupCall = (roomName, groupName) => {
        setCallState({
            status: "active",
            room: roomName,
            participant: { fullName: groupName, isGroup: true }
        });
    };

    useEffect(() => {
        if (!socket) return;

        const handleIncomingCall = ({ from, roomId }) => {
            setCallState({
                status: "ringing",
                room: roomId,
                participant: from
            });
        };

        const handleCallAccepted = ({ roomId }) => {
            setCallState(prev => ({ ...prev, status: "active", room: roomId }));
        };

        const handleCallDeclined = () => {
            toast.error("Call declined");
            setCallState({ status: "idle", room: null, participant: null });
        };

        const handleCallEnded = () => {
            toast.error("Call ended");
            setCallState({ status: "idle", room: null, participant: null });
        };

        socket.on("incomingCall", handleIncomingCall);
        socket.on("callAccepted", handleCallAccepted);
        socket.on("callDeclined", handleCallDeclined);
        socket.on("callEnded", handleCallEnded);

        return () => {
            socket.off("incomingCall", handleIncomingCall);
            socket.off("callAccepted", handleCallAccepted);
            socket.off("callDeclined", handleCallDeclined);
            socket.off("callEnded", handleCallEnded);
        };
    }, [socket]);

    const value = {
        callState, setCallState, initiateCall, acceptIncomingCall, declineIncomingCall, terminateCall, joinGroupCall
    }

    return (
        <CallContext.Provider value={value}>
            {children}
        </CallContext.Provider>
    )
}
