import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Loader2, Bot } from 'lucide-react';
import { toast } from 'sonner';
import MessageBubble from '../agents/MessageBubble';

export default function GuestChat({ guestInfo, onBack, onRideCreated }) {
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Chat functionality temporarily disabled during proxy refactor
        setError('AI Chat is currently undergoing maintenance. Please use the standard booking form.');
        setIsLoading(false);
    }, []);

    // Effect for subscription removed as chat is disabled
    /*
    useEffect(() => {
        const initConversation = async () => {
            try {
                setIsLoading(true);
                console.log('🤖 Creating conversation with agent:', 'ride_request_agent');
                console.log('📋 Guest info:', guestInfo);
                
                // Create conversation with guest info already provided
                const conv = await base44.agents.createConversation({
                    agent_name: 'ride_request_agent',
                    metadata: {
                        guest_name: guestInfo?.name || 'Guest',
                        guest_room: guestInfo?.room || 'Unknown',
                        guest_phone: guestInfo?.phone || '',
                        info_already_provided: true
                    }
                });
                
                console.log('✅ Conversation created:', conv?.id);
                setConversation(conv);
                
                // Send initial message with context
                if (conv && conv.id) {
                    console.log('💬 Sending initial message...');
                    await base44.agents.addMessage(conv, {
                        role: 'user',
                        content: `Hi, I'm ${guestInfo?.name} from room ${guestInfo?.room}. I need to book a shuttle ride. My phone number is ${guestInfo?.phone}.`
                    });
                    console.log('✅ Initial message sent');
                }
            } catch (error) {
                console.error('❌ Failed to create conversation:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                setError('Failed to start AI chat. Please use the classic form instead.');
                toast.error('Could not start AI assistant. Please try the classic booking form.', {
                    duration: 5000
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (guestInfo) {
            initConversation();
        }
    }, [guestInfo]);

    useEffect(() => {
        if (!conversation || !conversation.id) return;

        console.log('👂 Subscribing to conversation:', conversation.id);
        
        const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
            console.log('📨 Received conversation update:', data);
            setMessages(data.messages || []);
            setIsLoading(false);
            
            // Check if ride was created by checking tool calls
            const lastMessage = data.messages[data.messages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
                // Check tool calls for ride creation
                if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
                    const rideCreationTool = lastMessage.tool_calls.find(tc => 
                        tc.name === 'entities.Ride.create' && tc.status === 'completed'
                    );
                    
                    if (rideCreationTool) {
                        console.log('✅ Ride created successfully via AI chat');
                        toast.success('Your shuttle has been booked!');
                        // Give user time to read the success message
                        setTimeout(() => {
                            onRideCreated({ 
                                guest_name: guestInfo.name, 
                                guest_room: guestInfo.room,
                                guest_phone: guestInfo.phone 
                            });
                        }, 2000);
                    }
                }
            }
        });

        return () => {
            console.log('🔌 Unsubscribing from conversation');
            unsubscribe();
        };
    }, [conversation, guestInfo, onRideCreated]);
    */

    const handleSendMessage = async () => {
        if (!inputMessage || !inputMessage.trim() || !conversation) return;

        const messageText = inputMessage.trim();
        setInputMessage('');
        setIsLoading(true);

        try {
            console.log('📤 Sending message:', messageText);
            // await base44.agents.addMessage(conversation, {
            //     role: 'user',
            //     content: messageText
            // });
            console.warn('AI Chat is disabled');
        } catch (error) {
            console.error('❌ Failed to send message:', error);
            toast.error('Failed to send message. Please try again.');
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // If there's an error, show error state with option to go back
    if (error) {
        return (
            <Card className="shadow-2xl border-slate-200/80 animate-fade-in max-w-3xl mx-auto">
                <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
                    <CardTitle className="text-xl font-bold">Unable to Start AI Assistant</CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-center space-y-4">
                    <p className="text-slate-600">{error}</p>
                    <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back to Booking Options
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-2xl border-slate-200/80 animate-fade-in max-w-3xl mx-auto">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold">AI Booking Assistant</CardTitle>
                            <p className="text-blue-100 text-sm mt-1">
                                Hi {guestInfo?.name}! I'll help you book your ride.
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onBack} className="text-white hover:bg-white/20">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-lg p-4 h-[500px] overflow-y-auto space-y-4 border border-slate-200">
                    {messages.length === 0 && !isLoading && (
                        <div className="text-center py-12 text-slate-500">
                            <Bot className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                            <p className="font-medium text-lg">Starting your booking...</p>
                            <p className="text-sm mt-2">I already have your name, room, and phone number.</p>
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <MessageBubble key={idx} message={msg} />
                    ))}
                    {isLoading && messages.length === 0 && (
                        <div className="flex justify-center py-12">
                            <div className="text-center">
                                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-3" />
                                <p className="text-sm text-slate-600">Connecting to AI assistant...</p>
                            </div>
                        </div>
                    )}
                    {isLoading && messages.length > 0 && (
                        <div className="flex justify-start">
                            <div className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                                <span className="text-sm text-slate-600">AI is thinking...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message here..."
                        className="flex-1 h-12 text-base border-slate-300"
                        disabled={isLoading || !conversation}
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!inputMessage || !inputMessage.trim() || isLoading || !conversation}
                        className="h-12 px-6 bg-blue-600 hover:bg-blue-700"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}