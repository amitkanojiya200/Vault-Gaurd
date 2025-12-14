import React from 'react'
import SearchPanel from '../components/SearchPanel'
import BentoGrid from '@/components/ui/BentoGrid'
import Carousel from '@/components/ui/Carousel';
import HeroImg from "../assets/hero1.png";
import Banner1 from "../assets/banner1_1.png";

export default function SearchResults() {
  return (
    <div className="space-y-4">
      <SearchPanel onSearch={() => {}} />
      <div className="bg-white/4 rounded-lg p-4">
        <div className="text-sm opacity-80">Search results will be shown here (Module 5).</div>
      </div>
    </div>
    // <div className="p-5 overflow-x-hidden">
    //   <BentoGrid gap="gap-6">
    //     <img src="/1.jpg" alt="" />
    //     <img src="/2.jpg" alt="" />
    //     <img src="/3.jpg" alt="" />
    //     <div>4</div>
    //     <div>5</div>
    //     <video src="/6.mp4" muted loop />
    //   </BentoGrid>
    // </div>
  )
}
