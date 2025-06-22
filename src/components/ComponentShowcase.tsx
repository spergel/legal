'use client';

import { useState } from 'react';
import { Button, Badge, Modal, Input } from '@/components/ui';
import { 
  Calendar, 
  MapPin, 
  Star, 
  Users, 
  Mail, 
  Send, 
  Filter,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ComponentShowcase() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleShowToast = (type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        toast.success('This is a success message!');
        break;
      case 'error':
        toast.error('This is an error message!');
        break;
      case 'info':
        toast('This is an info message!');
        break;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">UI Component Showcase</h1>
        <p className="text-gray-600">All the new components working together</p>
      </div>

      {/* Buttons Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Buttons
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
            Primary
          </Button>
          <Button variant="secondary" icon={<Filter className="w-4 h-4" />}>
            Secondary
          </Button>
          <Button variant="outline" icon={<Mail className="w-4 h-4" />}>
            Outline
          </Button>
          <Button variant="ghost" icon={<Star className="w-4 h-4" />}>
            Ghost
          </Button>
          <Button variant="danger" icon={<X className="w-4 h-4" />}>
            Danger
          </Button>
          <Button loading>Loading</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Badges
        </h2>
        <div className="flex flex-wrap gap-4">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge size="sm">Small</Badge>
        </div>
      </div>

      {/* Inputs Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5" />
          Inputs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            icon={<Mail className="w-4 h-4" />}
            helperText="We'll never share your email"
          />
          <Input
            label="Event Name"
            placeholder="Enter event name"
            icon={<Calendar className="w-4 h-4" />}
            error="This field is required"
          />
          <Input
            label="Location"
            placeholder="Enter location"
            icon={<MapPin className="w-4 h-4" />}
          />
          <Input
            label="Organization"
            placeholder="Enter organization"
            icon={<Users className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Toast Demo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Send className="w-5 h-5" />
          Toast Notifications
        </h2>
        <div className="flex gap-4">
          <Button 
            variant="primary" 
            onClick={() => handleShowToast('success')}
            icon={<CheckCircle className="w-4 h-4" />}
          >
            Success Toast
          </Button>
          <Button 
            variant="danger" 
            onClick={() => handleShowToast('error')}
            icon={<X className="w-4 h-4" />}
          >
            Error Toast
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleShowToast('info')}
            icon={<Info className="w-4 h-4" />}
          >
            Info Toast
          </Button>
        </div>
      </div>

      {/* Modal Demo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Modal Dialog
        </h2>
        <Button 
          variant="primary" 
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Open Modal
        </Button>
      </div>

      {/* Feature Cards Demo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5" />
          Feature Cards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-lg border border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all duration-300">
            <div className="inline-flex p-3 rounded-lg mb-4 bg-blue-100 text-blue-600">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Event Discovery</h3>
            <p className="text-gray-600 mb-4">Find upcoming legal events and opportunities.</p>
            <Button variant="outline" size="sm">Learn More</Button>
          </div>
          
          <div className="p-6 rounded-lg border border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all duration-300">
            <div className="inline-flex p-3 rounded-lg mb-4 bg-blue-100 text-blue-600">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Details</h3>
            <p className="text-gray-600 mb-4">Get detailed venue information and directions.</p>
            <Button variant="outline" size="sm">View Map</Button>
          </div>
          
          <div className="p-6 rounded-lg border border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all duration-300">
            <div className="inline-flex p-3 rounded-lg mb-4 bg-blue-100 text-blue-600">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Save Favorites</h3>
            <p className="text-gray-600 mb-4">Star events you're interested in.</p>
            <Button variant="outline" size="sm">Star Events</Button>
          </div>
          
          <div className="p-6 rounded-lg border border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all duration-300">
            <div className="inline-flex p-3 rounded-lg mb-4 bg-blue-100 text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Community</h3>
            <p className="text-gray-600 mb-4">Connect with legal professionals.</p>
            <Button variant="outline" size="sm">Join Community</Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Example Modal"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This is an example modal dialog using the new Modal component. It includes proper accessibility features and smooth animations.
          </p>
          <Input
            label="Example Input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type something..."
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success('Action completed!');
              setIsModalOpen(false);
            }}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 