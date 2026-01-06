import { Locations } from "../gallary/Locations";
import { ScrollablePhotoList } from "../gallary/ScrollablePhotoList";
import Workshop from "../gallary/workshop";
import { models } from "@/data/models";

const GallaryPage = () => {
  return (
    <div className="w-full">
      <div className="container mx-auto px-4 sticky top-0 py-20">
        <Locations className="mb-8" />
        <ScrollablePhotoList models={models} />
        <Workshop />
      </div>
    </div>
  );
};

export default GallaryPage;
