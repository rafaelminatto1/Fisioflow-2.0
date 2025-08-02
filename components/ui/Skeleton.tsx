
interface SkeletonProps {
  className?: string;
}

const Skeleton = ({ className }: SkeletonProps) => {
  return <div className={`bg-slate-200 animate-pulse ${className}`} />;
};

export default Skeleton;
