import { GraduationCap } from "lucide-react";

const Hero = () => {
  return (
    <div className="flex justify-start w-[24vw] items-center gap-4 my-4">
      <div className="bg-blue-700 rounded-sm p-2">
        <GraduationCap color="white" />
      </div>
      <h1 className="text-blue-700 font-semibold text-2xl">OmniEnglish</h1>
    </div>
  );
};

export default Hero;
