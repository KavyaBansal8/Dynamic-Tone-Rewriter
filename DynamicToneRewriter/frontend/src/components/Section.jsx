import React from "react";

const Section = ({ id, title, description, bg }) => (
  <div id={id} className={`h-screen w-screen flex items-center justify-center ${bg} text-white text-center p-10`}>
    <div>
      <h2 className="text-4xl font-bold mb-4">{title}</h2>
      <p className="text-lg mb-4">{description}</p>
      <button className="bg-white text-black px-6 py-2 rounded-full shadow-md hover:bg-gray-200 transition">
        Learn More
      </button>
    </div>
  </div>
);

export default Section;


// import React from "react";

// const Section = ({ id, title, description, bg, onAuthClick }) => (
//   <div id={id} className={`h-screen w-screen flex items-center justify-center ${bg} text-white text-center p-10`}>
//     <div>
//       <h2 className="text-4xl font-bold mb-4">{title}</h2>
//       <p className="text-lg mb-4">{description}</p>
//       <button onClick={onAuthClick} className="bg-white text-black px-6 py-2 rounded-full shadow-md hover:bg-gray-200 transition">
//         Sign Up to Use
//       </button>
//     </div>
//   </div>
// );

// export default Section;
