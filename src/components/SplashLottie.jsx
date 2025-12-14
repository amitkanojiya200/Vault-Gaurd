// // src/components/SplashLottie.jsx
// import React from 'react'
// import Lottie from 'lottie-react'
// import animationData from '../branding/splashLottie.json' // add a Lottie JSON here
// import { motion } from 'framer-motion'

// export default function SplashLottie({ onDone }) {
//   React.useEffect(() => {
//     const t = setTimeout(() => onDone && onDone(), 5000)
//     return () => clearTimeout(t)
//   }, [onDone])

//   return (
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-navy to-coastal">
//       <div className="w-80">
//         <Lottie animationData={animationData} loop={false} />
//       </div>
//     </motion.div>
//   )
// }
