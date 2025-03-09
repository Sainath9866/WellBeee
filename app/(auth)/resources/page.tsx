import { FaBook, FaHeart, FaMitten } from 'react-icons/fa';

const ResourcesPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-100">Mental Health Resources</h1>
      
      {/* Guided Meditations Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center text-gray-100">
          <FaMitten className="mr-2" /> Guided Meditations
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Mindfulness Meditation</h3>
            <p className="text-gray-600 mb-4">10 minutes of guided mindfulness practice</p>
            <a href="https://www.youtube.com/watch?v=ZToicYcHIOU" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors">
              Start Session
            </a>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Sleep Meditation</h3>
            <p className="text-gray-600 mb-4">Calming meditation for better sleep</p>
            <a href="https://www.youtube.com/watch?v=aEqlQvczMJQ" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors">
              Start Session
            </a>
          </div>
        </div>
      </section>

      {/* Educational Articles Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center text-gray-100">
          <FaBook className="mr-2" /> Educational Articles
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <a href="#" className="block bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Understanding Anxiety and Its Effects</h3>
            <p className="text-gray-600">Learn about the different types of anxiety and coping mechanisms</p>
          </a>
          <a href="#" className="block bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">The Importance of Self-Care</h3>
            <p className="text-gray-600">Discover why self-care is crucial for mental health</p>
          </a>
        </div>
      </section>

      {/* Self-Care Activities Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center text-gray-100">
          <FaHeart className="mr-2" /> Self-Care Activities
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">5-4-3-2-1 Grounding</h3>
            <p className="text-gray-600">Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This exercise helps anchor you to the present moment.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Joy Journal</h3>
            <p className="text-gray-600">Take 5 minutes to write down three positive moments from your day, no matter how small. This practice helps train your brain to notice the good.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Digital Sunset</h3>
            <p className="text-gray-600">Turn off screens 1 hour before bed. Instead, try reading, stretching, or listening to calming music to improve sleep quality and reduce anxiety.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ResourcesPage;
