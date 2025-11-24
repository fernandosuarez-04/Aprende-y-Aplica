'use client'

import { motion } from 'framer-motion'
import { ArrowLeftIcon, HeartIcon, LightBulbIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CreditsPage() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)

  const creators = [
    {
      name: "Fernando Suarez",
      role: "Project Manager & Full Stack",
      description: "Líder del proyecto y desarrollador full stack",
      avatar: "/fernando.jpg",
      skills: ["Project Management", "Full Stack Development", "Liderazgo"],
      color: "from-blue-500 to-cyan-500"
    },
    {
      name: "Israel Diaz",
      role: "Programador Backend y Bases de Datos",
      description: "Especialista en desarrollo backend y gestión de bases de datos",
      avatar: "/israel.jpg",
      skills: ["Backend Development", "Database Management", "API Development"],
      color: "from-red-500 to-orange-500"
    },
    {
      name: "Gael Flores",
      role: "Programador Backend y Agente IA",
      description: "Desarrollador backend especializado en inteligencia artificial",
      avatar: "/gael.jpg",
      skills: ["Backend Development", "AI Integration", "Machine Learning"],
      color: "from-purple-500 to-violet-500"
    },
    {
      name: "Alexis Echeverria",
      role: "Programador Frontend y Diseñador UX/UI",
      description: "Desarrollador frontend y diseñador de experiencia de usuario",
      avatar: "/alexis.jpg",
      skills: ["Frontend Development", "UX/UI Design", "React Development"],
      color: "from-pink-500 to-rose-500"
    }
  ]

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

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.7
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">

      {/* Botón de volver fijo */}
      <motion.button
        onClick={() => router.back()}
        className="fixed top-8 left-8 px-6 py-3 bg-gray-700/90 backdrop-blur-sm hover:bg-gray-600/90 text-white rounded-lg transition-all duration-300 border border-gray-600/50 flex items-center space-x-2 z-50 shadow-lg"
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
        className="px-6 pt-16 lg:px-8 pb-8"
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
          <div className="inline-block mb-6">
            <SparklesIcon className="w-16 h-16 text-yellow-400 mx-auto" />
          </div>
          
          <motion.h1 
            className="text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            ¡Huevo de Pascua Encontrado! 🥚
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Has descubierto el secreto oculto de Aprende y Aplica. 
            Conoce a las personas increíbles que hacen posible esta plataforma.
          </motion.p>
        </motion.div>

        {/* Sección de creadores */}
        <motion.section 
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-4xl font-bold text-white text-center mb-12 flex items-center justify-center">
            <HeartIcon className="w-10 h-10 text-red-400 mr-4" />
            Nuestro Equipo
            <HeartIcon className="w-10 h-10 text-red-400 ml-4" />
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {creators.map((creator, index) => (
              <motion.div
                key={index}
                className="group relative"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ 
                  y: -5,
                  transition: { duration: 0.2 }
                }}
              >
                {/* Efecto de brillo en hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/50 group-hover:border-blue-400/70 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/30 group-hover:bg-gray-700/80">
                  <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-2 border-gray-600 group-hover:border-blue-400 transition-colors duration-300">
                      <img 
                        src={creator.avatar} 
                        alt={creator.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay de gradiente */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${creator.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">
                      {creator.name}
                    </h3>
                    
                    <p className={`text-transparent bg-clip-text bg-gradient-to-r ${creator.color} font-semibold mb-3 text-lg drop-shadow-lg`}>
                      {creator.role}
                    </p>
                    
                    <p className="text-gray-200 mb-4 text-sm leading-relaxed">
                      {creator.description}
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-2">
                      {creator.skills.map((skill, skillIndex) => (
                        <span 
                          key={skillIndex}
                          className={`px-3 py-1 bg-gradient-to-r ${creator.color} text-white rounded-full text-xs font-medium border border-white/30 hover:scale-105 transition-all duration-200 shadow-lg`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Mensaje especial */}
        <motion.div 
          className="text-center bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 border border-blue-500/30 backdrop-blur-sm relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="relative">
            <LightBulbIcon className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-white mb-4">
              ¡Gracias por descubrir nuestro secreto!
            </h3>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Este huevo de pascua es nuestro pequeño homenaje a todos los usuarios curiosos 
              que exploran cada rincón de nuestra plataforma. 
              <br /><br />
              <span className="text-blue-400 font-semibold">
                ¡Sigue aprendiendo y aplicando! 🚀
              </span>
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer compacto */}
      <footer className="text-center py-6 text-gray-400 bg-gray-900/50 backdrop-blur-sm border-t border-gray-700/50">
        <p className="opacity-80">
          Hecho con ❤️ por el equipo de Aprende y Aplica
        </p>
      </footer>
    </div>
  )
}