'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  Save, 
  AlertTriangle,
  Loader2,
  Wand2,
  MessageSquare,
  Lightbulb,
  Target,
  Users,
  Bot,
  Zap,
  Star,
  Heart,
  ChevronLeft,
  Download,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@aprende-y-aplica/ui';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  isPromptSection?: boolean;
  sectionType?: 'title' | 'description' | 'content' | 'tags' | 'difficulty' | 'use_cases' | 'tips';
}

interface GeneratedPrompt {
  title: string;
  description: string;
  content: string;
  tags: string[];
  difficulty_level: string;
  use_cases: string[];
  tips: string[];
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: '¡Hola! Soy Lia, tu asistente especializada en creación de prompts de IA. Estoy aquí para ayudarte a crear prompts profesionales y efectivos.\n\n¿En qué tipo de prompt te gustaría trabajar hoy? Por ejemplo:\n\n• Quiero crear un prompt para generar contenido de marketing\n• Necesito un prompt para programación en Python\n• Busco un prompt para crear arte digital\n\n¡Cuéntame tu idea y comenzamos!',
    sender: 'ai',
    timestamp: new Date().toLocaleTimeString(),
  },
];

const tips = [
  {
    icon: Target,
    title: "Sé específico",
    description: "Describe claramente el propósito y objetivo del prompt"
  },
  {
    icon: Users,
    title: "Define tu audiencia",
    description: "Menciona el contexto y audiencia objetivo"
  },
  {
    icon: Zap,
    title: "Establece el tono",
    description: "Describe el tono y estilo deseado"
  },
  {
    icon: Lightbulb,
    title: "Incluye ejemplos",
    description: "Proporciona ejemplos si es necesario"
  }
];

export default function CreatePromptPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [savePromptTitle, setSavePromptTitle] = useState('');
  const [savePromptDescription, setSavePromptDescription] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);
    setGeneratedPrompt(null);

    try {
      const response = await fetch('/api/ai-directory/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input, conversationHistory: messages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el prompt');
      }

      const data = await response.json();
      // console.log('📥 Frontend received data:', data);
      const aiResponseText = data.response;
      const newGeneratedPrompt: GeneratedPrompt = data.generatedPrompt;

      const newAiMessage: Message = {
        id: Date.now().toString() + '-ai',
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, newAiMessage]);
      setGeneratedPrompt(newGeneratedPrompt);

    } catch (error: any) {
      // console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-error',
          text: `Lo siento, hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo.`,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(section);
    setTimeout(() => setIsCopied(null), 2000);
  };

  const handleSavePrompt = async () => {
    if (!generatedPrompt || !savePromptTitle || !savePromptDescription) return;

    setIsLoading(true);
    try {
      // TODO: Implement actual save to database API endpoint
      // console.log('Saving prompt:', {
      //   ...generatedPrompt,
      //   title: savePromptTitle,
      //   description: savePromptDescription,
      // });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('Prompt guardado exitosamente!');
      setIsSaveModalOpen(false);
      setSavePromptTitle('');
      setSavePromptDescription('');
      setGeneratedPrompt(null);
      router.push('/prompt-directory');
    } catch (error) {
      // console.error('Error saving prompt:', error);
      alert('Error al guardar el prompt.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPrompt = () => {
    if (!generatedPrompt) return;

    const promptContent = `# ${generatedPrompt.title}

## Descripción
${generatedPrompt.description}

## Contenido del Prompt
${generatedPrompt.content}

## Tags
${generatedPrompt.tags.join(', ')}

## Nivel de Dificultad
${generatedPrompt.difficulty_level}

## Casos de Uso
${generatedPrompt.use_cases.map(uc => `- ${uc}`).join('\n')}

## Consejos
${generatedPrompt.tips.map(tip => `- ${tip}`).join('\n')}

---
Generado por Lia - Asistente de IA para Creación de Prompts
Fecha: ${new Date().toLocaleString()}
`;

    const blob = new Blob([promptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${generatedPrompt.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-slate-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700/50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/prompt-directory"
              className="flex items-center gap-3 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors group"
            >
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 group-hover:bg-gray-200 dark:group-hover:bg-slate-700 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-slate-300" />
              </div>
              <span className="font-medium">Volver al Directorio</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Constructor de Prompts IA</h1>
                <p className="text-sm text-gray-600 dark:text-slate-400">Crea prompts profesionales con Lia</p>
              </div>
            </div>
            
            <div className="w-32"></div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-8 min-h-[calc(100vh-140px)] sm:min-h-[calc(100vh-180px)]">
          {/* Chat Section */}
          <motion.div
            className="lg:col-span-2 flex flex-col bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700/50 overflow-hidden order-1 lg:order-1 h-[60vh] sm:h-auto shadow-lg dark:shadow-xl"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Chat Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700/50 bg-gray-50 dark:bg-gradient-to-r dark:from-slate-800/80 dark:to-slate-700/80 flex-shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-purple-500/50 shadow-lg">
                    <Image
                      src="/lia-avatar.png"
                      alt="Lia - Asistente de IA"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">Lia</h2>
                  <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm truncate">Especialista en creación de prompts</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                  <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></div>
                  En línea
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar min-h-0">
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className={`max-w-[85%] sm:max-w-[80%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                    {msg.sender === 'ai' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden border border-purple-500/50">
                          <Image
                            src="/lia-avatar.png"
                            alt="Lia"
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">Lia</span>
                      </div>
                    )}
                    <div
                      className={`p-3 sm:p-4 rounded-2xl shadow-lg ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-gray-100 dark:bg-slate-700/80 text-gray-900 dark:text-slate-100 border border-gray-200 dark:border-slate-600/50'
                      }`}
                    >
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      <span className={`text-xs opacity-70 block mt-2 text-right ${msg.sender === 'ai' ? 'text-gray-600 dark:text-slate-400' : 'text-white/70'}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] sm:max-w-[80%]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden border border-purple-500/50">
                        <Image
                          src="/lia-avatar.png"
                          alt="Lia"
                          width={24}
                          height={24}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">Lia</span>
                    </div>
                    <div className="p-3 sm:p-4 rounded-2xl bg-gray-100 dark:bg-slate-700/80 text-gray-900 dark:text-slate-100 border border-gray-200 dark:border-slate-600/50 flex items-center gap-3">
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-purple-600 dark:text-purple-400" />
                      <span className="text-xs sm:text-sm">Pensando...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-800/30 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    className="w-full p-4 sm:p-4 pr-12 sm:pr-12 rounded-xl bg-white dark:bg-slate-700/80 border border-gray-300 dark:border-slate-600/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base sm:text-base h-12 sm:h-auto"
                    placeholder="Describe qué tipo de prompt quieres crear..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 sm:right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 sm:w-2 sm:h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="w-full sm:w-auto px-6 sm:px-6 py-4 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 h-12 sm:h-auto"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 sm:w-5 sm:h-5" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="space-y-4 sm:space-y-6 flex flex-col order-2 lg:order-2 lg:h-full"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Generated Prompt */}
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700/50 p-4 sm:p-6 lg:flex-1 lg:flex lg:flex-col lg:min-h-0 shadow-lg dark:shadow-xl">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Prompt Generado</h3>
              </div>
              
              {generatedPrompt ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 sm:space-y-4 lg:flex-1 lg:overflow-y-auto lg:custom-scrollbar"
                >
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-slate-600/30">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Target className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm sm:text-base">Título</span>
                    </h4>
                    <p className="text-gray-700 dark:text-slate-300 text-xs sm:text-sm">{generatedPrompt.title}</p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-slate-600/30">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm sm:text-base">Contenido</span>
                    </h4>
                    <div className="text-gray-700 dark:text-slate-300 text-xs sm:text-sm max-h-20 sm:max-h-32 overflow-y-auto custom-scrollbar prose prose-invert dark:prose-invert prose-sm max-w-none">
                      <ReactMarkdown 
                        components={{
                          h1: ({children}) => <h1 className="text-gray-900 dark:text-white text-lg font-bold mb-2">{children}</h1>,
                          h2: ({children}) => <h2 className="text-gray-900 dark:text-white text-base font-semibold mb-2 mt-3">{children}</h2>,
                          h3: ({children}) => <h3 className="text-gray-900 dark:text-white text-sm font-semibold mb-1 mt-2">{children}</h3>,
                          p: ({children}) => <p className="text-gray-700 dark:text-slate-300 mb-2">{children}</p>,
                          strong: ({children}) => <strong className="text-gray-900 dark:text-white font-semibold">{children}</strong>,
                          em: ({children}) => <em className="text-purple-700 dark:text-purple-300 italic">{children}</em>,
                          code: ({children}) => <code className="bg-gray-100 dark:bg-slate-800 text-green-700 dark:text-green-300 px-1 py-0.5 rounded text-xs">{children}</code>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          li: ({children}) => <li className="text-gray-700 dark:text-slate-300">{children}</li>,
                        }}
                      >
                        {generatedPrompt.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {generatedPrompt.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-500/20 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleDownloadPrompt}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                      Descargar
                    </Button>
                    <Button
                      onClick={() => {
                        setSavePromptTitle(generatedPrompt.title);
                        setSavePromptDescription(generatedPrompt.description);
                        setIsSaveModalOpen(true);
                      }}
                      className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                      Guardar
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center">
                    <Target className="w-8 h-8 text-gray-600 dark:text-slate-400" />
                  </div>
                  <p className="text-gray-600 dark:text-slate-400 text-sm">
                    Comienza una conversación para generar tu prompt personalizado
                  </p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700/50 p-4 sm:p-6 flex-shrink-0 shadow-lg dark:shadow-xl">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                  <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Consejos para mejores resultados</h3>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {tips.map((tip, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-gray-50 dark:bg-slate-700/30 border border-gray-200 dark:border-slate-600/30 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-slate-600/50 flex-shrink-0">
                      <tip.icon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">{tip.title}</h4>
                      <p className="text-gray-600 dark:text-slate-400 text-xs mt-1 leading-relaxed">{tip.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Save Modal */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-6"
          >
            <motion.div
              initial={{ y: -50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-md"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-500">
                  <Save className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Guardar Prompt</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="promptTitle" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    id="promptTitle"
                    className="w-full p-3 rounded-xl bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    value={savePromptTitle}
                    onChange={(e) => setSavePromptTitle(e.target.value)}
                    placeholder="Título de tu prompt"
                  />
                </div>
                <div>
                  <label htmlFor="promptDescription" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    id="promptDescription"
                    rows={3}
                    className="w-full p-3 rounded-xl bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                    value={savePromptDescription}
                    onChange={(e) => setSavePromptDescription(e.target.value)}
                    placeholder="Una breve descripción de tu prompt"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsSaveModalOpen(false)} 
                    className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white px-6 py-2"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSavePrompt}
                    disabled={isLoading || !savePromptTitle || !savePromptDescription}
                    className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-2 rounded-xl transition-all duration-300 flex items-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}