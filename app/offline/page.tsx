'use client'

export default function Offline() {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Você está offline</h1>
        <p className="text-gray-600 mb-4">
          Parece que você perdeu sua conexão com a internet. Verifique sua conexão e tente novamente.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    )
  }