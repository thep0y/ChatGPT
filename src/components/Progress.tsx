import React from 'react'
import { Progress } from 'antd'
import '~/styles/progress.scss'

interface MaskProgressProps {
  progress: number
}

const MaskProgress: React.FC<MaskProgressProps> = ({ progress }) => {
  return (
    <div id="mask-progress">
      <Progress type='circle' percent={progress} />
    </div>
  )
}

export default MaskProgress
