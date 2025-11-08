'use client'

import { motion } from 'framer-motion'
import { ArrowLeftIcon, SparklesIcon, TrophyIcon, StarIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function EasterEggPage() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.15
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.6
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 relative overflow-hidden">
      {/* Partículas de fondo animadas */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Botón de volver fijo */}
      <motion.button
        onClick={() => router.back()}
        className="fixed top-8 left-8 px-6 py-3 bg-purple-700/90 backdrop-blur-sm hover:bg-purple-600/90 text-white rounded-lg transition-all duration-300 border border-purple-600/50 flex items-center space-x-2 z-50 shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span className="font-medium">Volver</span>
      </motion.button>

      {/* Contenido principal */}
      <motion.div 
        className="px-6 pt-16 lg:px-8 pb-8 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Título principal */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="inline-block mb-6"
            animate={{ 
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <TrophyIcon className="w-20 h-20 text-yellow-400 mx-auto drop-shadow-lg" />
          </motion.div>
          
          <motion.h1 
            className="text-5xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 mb-6 drop-shadow-2xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            ¡Easter Egg Encontrado! 🎉
          </motion.h1>
          
          <motion.p 
            className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            ¡Felicitaciones! Has descubierto el secreto oculto de Aprende y Aplica.
            <br />
            <span className="text-yellow-300 font-semibold text-2xl mt-4 block">
              Eres un verdadero explorador 🚀
            </span>
          </motion.p>
        </motion.div>

        {/* Logo animado */}
        <motion.div
          className="flex justify-center mb-12"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <motion.div
            className="relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-yellow-400/50 shadow-2xl"
            animate={{
              rotate: [0, 360],
              boxShadow: [
                '0 0 20px rgba(255, 215, 0, 0.5)',
                '0 0 40px rgba(255, 215, 0, 0.8)',
                '0 0 20px rgba(255, 215, 0, 0.5)',
              ],
            }}
            transition={{
              rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
              boxShadow: { duration: 2, repeat: Infinity },
            }}
          >
            <Image
              src="/icono.png"
              alt="Aprende y Aplica Logo"
              width={128}
              height={128}
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-purple-400/20" />
          </motion.div>
        </motion.div>

        {/* Mensaje especial */}
        <motion.div 
          className="text-center bg-gradient-to-r from-yellow-600/30 via-pink-600/30 to-purple-600/30 rounded-2xl p-8 lg:p-12 border-2 border-yellow-400/50 backdrop-blur-sm relative overflow-hidden max-w-4xl mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="relative z-10">
            <motion.div
              className="flex justify-center mb-6"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <SparklesIcon className="w-16 h-16 text-yellow-400" />
            </motion.div>
            
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              ¡Has Desbloqueado el Modo Secreto! ✨
            </h3>
            
            <div className="space-y-4 text-lg text-white/90 leading-relaxed">
              <p>
                Solo los usuarios más curiosos y persistentes logran encontrar este lugar especial.
              </p>
              <p className="text-yellow-300 font-semibold text-xl">
                Has hecho clic 5 veces consecutivas en nuestro logo. ¡Eso es dedicación! 👏
              </p>
              <div className="flex justify-center gap-2 mt-6">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.3, 1],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  >
                    <StarIcon className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                ))}
              </div>
              <p className="mt-8 text-purple-200 italic">
                "La curiosidad es el motor del aprendizaje"
              </p>
            </div>
          </div>
          
          {/* Efecto de brillo animado */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          />
        </motion.div>

        {/* Botón para volver al dashboard */}
        <motion.div
          className="flex justify-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <motion.button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-xl transition-all duration-300 border-2 border-white/20 flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Volver al Dashboard</span>
            <ArrowLeftIcon className="w-5 h-5 rotate-180" />
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <footer className="text-center py-6 text-white/70 bg-black/20 backdrop-blur-sm border-t border-white/10 relative z-10">
        <p className="opacity-80 flex items-center justify-center gap-2">
          <span>Hecho con</span>
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            ❤️
          </motion.span>
          <span>por el equipo de Aprende y Aplica</span>
        </p>
      </footer>
    </div>
  )
}

