'use client';
import React from "react";
import Image from "next/image";
import {cn }from "@/lib/utils";
import { useRouter } from "next/navigation";
import {useEffect, useState} from "react";
import {vapi} from "@/lib/vapi.sdk";

enum CallStatus {
    INACTIVE = 'INACTIVE',
    ACTIVE = 'ACTIVE',
    CONNECTING = 'CONNECTING',
    FINISHED = 'FINISHED',
}

interface SavedMessage {
    role: 'user' | 'system' | 'assistant';
    content: string;
}

// loose message typing for events from vapi
interface Message {
    type?: string;
    transcriptType?: string;
    transcript?: string;
    role?: 'user' | 'assistant' | 'system';
    content?: string;
}

const Agent = ({userName , userId, type}: AgentProps) => {
    const router = useRouter();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const lastMessage = messages[messages.length - 1];

    useEffect(() => {
        const onCallStart = (message: Message) => {
            if (message.type === 'transcript' && message.transcriptType === 'final'){
               const newMessage: SavedMessage = { role: message.role ?? 'assistant' , content: message.transcript ?? '' };
                setMessages((prev) => [...prev, newMessage]);
            }
        }

        const onCallEnd = () => {
            setCallStatus(CallStatus.FINISHED);
            setIsSpeaking(false);
        }

        const onMessage = (message: Message) => {
            const content = message.transcript ?? message.content;
            if (content) {
                const newMessage: SavedMessage = { role: message.role ?? 'assistant', content };
                setMessages((prev) => [...prev, newMessage]);
            }
        }

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);
        const onError = (error: Error) => console.log('VAPI Error:', error);

        // cast handlers to any to avoid signature mismatch with vapi typings
        vapi.on('call-start', onCallStart as any);
        vapi.on('call-end', onCallEnd as any);
        vapi.on('message', onMessage as any);
        vapi.on('speech-start', onSpeechStart as any);
        vapi.on('speech-end', onSpeechEnd as any);
        vapi.on('error', onError as any);

        return () => {
            vapi.off('call-start', onCallStart as any);
            vapi.off('call-end', onCallEnd as any);
            vapi.off('message', onMessage as any);
            vapi.off('speech-start', onSpeechStart as any);
            vapi.off('speech-end', onSpeechEnd as any);
            vapi.off('error', onError as any);
        }
    },[])

    useEffect(() => {
        if(callStatus === CallStatus.FINISHED) router.push('/');
    }, [messages, callStatus, type, userId]);

    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);

        try {
            await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!,{
                variableValues: {
                    username: userName,
                    userId: userId,
                }
            });
            setCallStatus(CallStatus.ACTIVE);
        } catch (err) {
            console.error('Failed to start vapi:', err);
            setCallStatus(CallStatus.INACTIVE);
        }
    }

    const handleDisconnect = async () => {
        setCallStatus(CallStatus.FINISHED);
        vapi.stop();
    }

    const latestMessage = messages[messages.length - 1]?.content ;
    const isCallInactiveOrFinished = callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;
    
  return(
    <>
    <div className="call-view">
    <div className="card-interviewer">
        <div className="avatar">
            <Image  src="/ai-avatar.png"
            alt="vapi"
            width={65}
            height={54} className="object-cover"
            />
            {isSpeaking && <span className="animate-speak"></span>}
        </div>
        <h3>AI Interviewer</h3>
    </div>
    <div className="card-border">
        <div className="card-content">
            {/* Initials avatar instead of backend image */}
            <div className="w-[120px] h-[120px] rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-4xl font-semibold text-gray-800 dark:text-gray-100">
                {userName ? userName.charAt(0).toUpperCase() : '?'}
            </div>

            <h3>{userName}</h3>
        </div>
    </div>
  </div>
  {messages.length >0 && (
    <div className="transcript-border">
        <div className="transcript">
            <p key={messages.length} className={cn("transition-opacity duration-500 opacity-0","animate-fadeIn opacity-100")}>
                {latestMessage}
            </p>
        </div>
    </div>
  )}
    <div className="w-full flex justify-center">
        {callStatus !== CallStatus.ACTIVE ? (
            <button className="relative btn-call" onClick={handleCall}>
                <span className={cn('absolute animate-ping rounded-full rounded-full opacity-75', (callStatus !== CallStatus.CONNECTING) && 'hidden')}
                />
                <span>
                    {callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED ? 'Call' : '. . .'}
                </span>
            </button>
        ) : (
            <button className="btn-disconnect" onClick={handleDisconnect}>
                End

            </button>
        )}
    </div>
    </>
  )

};

export default Agent;
