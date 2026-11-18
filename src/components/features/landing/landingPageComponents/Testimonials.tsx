import React from 'react'
import { FaStar } from 'react-icons/fa'

import testimonialImage from '@/assets/testimonial.png'
import { Text } from '@/components/ui/Typography'

import { SectionHeader } from './SectionHeader'
import style from './styles/Testimonal.module.scss'

export const Testimonials = () => (
  <div className={style.wrapper}>
    <SectionHeader
      title="Testimonials"
      subTitle="Loved by Hiring Teams Who Move Fast."
      centered
    />
    <div className={style.container}>
      <div className={style.testimonial}>
        <div className={style.stars}>
          {Array.from({ length: 5 }, (_, i) => (
            <FaStar key={i} className={style.star} />
          ))}
        </div>
        <Text size="fs-3xl" color="white" weight="bolder">
          AuxHR gave us back weeks of time. We hired three top-tier developers
          in half the usual time
        </Text>
        <div>
          <Text size="fs-2xl" weight="bold" color="white">
            —Sarah
          </Text>
          <Text size="fs-md" weight="normal" color="white">
            CTO at SeedTech
          </Text>
        </div>
      </div>
      <img src={testimonialImage} alt="Testimonilas" className={style.image} />
    </div>
  </div>
)
