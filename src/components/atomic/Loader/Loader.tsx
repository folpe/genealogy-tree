import React from 'react'

import Logo from '../../../assets/logo.svg'
import { Dots } from './elements/Dots'

interface ILoader {
  dots?: boolean
}

export const Loader: React.FC<ILoader> = ({ dots = false }) => {
  if (dots) {
    return <Dots size="small" />
  }

  return (
    <div className="flex flex-col items-center justify-center  w-full p-8 rounded-xl h-full ">
      {/* Logo pulse animation */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full opacity-20 animate-pulse bg-white"></div>
        <div className="relative z-10 bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-md">
          <img src={Logo} alt="logo" />
        </div>
      </div>

      {/* Main loading text */}
      <h2 className="text-2xl font-bold mb-2 text-primary animate-pulse">
        <span className="mr-2">Chargement en cours</span>
      </h2>

      {/* Subtle description */}
      <p className="text-gray-400 mb-6 text-center max-w-md">
        Nous préparons tout ce dont vous avez besoin.
        <br /> Merci de patienter quelques instants.
      </p>

      <Dots />
    </div>
  )
}
