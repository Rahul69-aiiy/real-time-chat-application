import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({children}) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({})
    
    // Video call state
    const [callState, setCallState] = useState({
        status: "idle", // idle,  dialing, ringing, active
        room: null,
        participant: null
    });

    const {authUser, socket, axios} = useContext(AuthContext)

    // function to get all users for sidebar
    const getUsers = async () => {
        try {
            const {data} = await axios.get("/api/messages/users")
            if(data.success) {
                setUsers(data.users)
                setUnseenMessages((prev) => ({...prev, ...data.unseenMessages}))
            }
        } catch(error) {
            toast.error(error.message)
        }
    }

    // function to get all groups for sidebar
    const getGroups = async () => {
        try {
            const {data} = await axios.get("/api/groups")
            if(data.success) {
                setGroups(data.groups)
            }
        } catch(error) {
            toast.error(error.message)
        }
    }

    // function to create group
    const createGroup = async (groupData) => {
        try {
            const {data} = await axios.post("/api/groups", groupData)
            if(data.success) {
                setGroups((prevGroups) => [...prevGroups, data.group])
                toast.success(data.message)
                return data.group
            } else {
                toast.error(data.message)
            }
        } catch(error) {
            toast.error(error.message)
        }
    }

    // function to send message to selected user/group
    const sendMessage = async (messageData) => {
        try {
            const url = selectedUser.isGroup 
                ? `/api/messages/group/send/${selectedUser._id}`
                : `/api/messages/send/${selectedUser._id}`;
            const {data} = await axios.post(url, messageData);
            if(data.success) {
                setMessages((prevMessages) => [...prevMessages, data.newMessage])
            } else {
                toast.error(data.message)
            }
        } catch(error) {
            toast.error(error.message)
        }
    }

    // function to subscribe to messages for selected user or group
    const subscribeToMessages = () => {
        if(!socket) return;
        socket.on("newMessage", async (newMessage)=> {
            if (newMessage.groupId) {
                if (selectedUser && selectedUser.isGroup && newMessage.groupId === selectedUser._id) {
                    setMessages((prevMessages) => [...prevMessages, newMessage]);
                } else {
                    setUnseenMessages((prevUnseenMessages) => ({
                        ...prevUnseenMessages, [newMessage.groupId] : prevUnseenMessages[newMessage.groupId] ? prevUnseenMessages[newMessage.groupId]+1: 1
                    }))
                }
            } else {
                if(selectedUser && !selectedUser.isGroup && newMessage.senderId === selectedUser._id) {
                    newMessage.seen = true;
                    setMessages((prevMessages)=> [...prevMessages, newMessage])
                    try {
                        await axios.put(`/api/messages/mark/${newMessage._id}`)
                    }
                    catch (error) {
                        console.log(error)
                    }
                } else {
                    setUnseenMessages((prevUnseenMessages) => ({
                        ...prevUnseenMessages, [newMessage.senderId] : prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId]+1: 1
                    }))
                }
            }
        })
    }

    // function to unsubscribe from messages
    const unsubscribeFromMessages = () => {
        if(socket) socket.off("newMessage");
    }

    useEffect(() => {
        subscribeToMessages()
        return () => unsubscribeFromMessages();
    }, [socket, selectedUser])

    // function to get messages for selected user/group
    const getMessages = async(id, isGroup = false) => {
        try {
            const url = isGroup ? `/api/messages/group/${id}` : `/api/messages/${id}`;
            const {data} = await axios.get(url);
            if(data.success) {
                setMessages(data.messages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

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

    const joinGroupCall = (roomName) => {
        setCallState({
            status: "active",
            room: roomName,
            participant: { fullName: selectedUser.name, isGroup: true }
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
        messages, users, groups, selectedUser, getMessages, getUsers, getGroups, createGroup, sendMessage, setSelectedUser, setUnseenMessages, unseenMessages,
        callState, setCallState, initiateCall, acceptIncomingCall, declineIncomingCall, terminateCall, joinGroupCall
    }

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}