import './Skeleton.css'

export default function Skeleton({ width, height, radius = 'md', className = '' }) {
  return <div className={`skeleton skeleton--${radius} ${className}`} style={{ width, height }} />
}
