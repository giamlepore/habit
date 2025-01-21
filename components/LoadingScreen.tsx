import Image from 'next/image'

export default function LoadingScreen() {
    return (
        <div className="flex flex-col justify-center items-center h-screen">
            <div className="relative">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-100"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Image 
                        src="/caracol.png"
                        alt="Caracol carregando"
                        width={32}
                        height={32}
                    />
                </div>
            </div>
        </div>
    )
}