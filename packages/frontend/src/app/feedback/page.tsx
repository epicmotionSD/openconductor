'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Heart, Star } from 'lucide-react'

export default function FeedbackPage() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    experience: '',
    testimonial: '',
    rating: 5,
    permission: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSubmitted(true)
      } else {
        console.error('Failed to submit feedback:', result.message)
        alert('Failed to submit feedback. Please try again or contact us directly.')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Network error. Please try again or contact us directly.')
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Thank you!</h2>
            <p className="text-gray-600 mb-6">
              Your feedback has been submitted. We really appreciate you taking the time to share your experience with OpenConductor!
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                🚀 <strong>Launch Day is Saturday!</strong><br />
                Your testimonial might be featured in our Product Hunt launch. We'll reach out if we'd like to include your story.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Share Your OpenConductor Experience
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            You're one of our first 70+ users! Help us tell the world about OpenConductor
          </p>
          <div className="flex items-center justify-center gap-2 text-yellow-500 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <p className="text-sm text-gray-500">
            Your feedback will help shape our Saturday Product Hunt launch
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Tell Us About Your Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Role
                  </label>
                  <Input
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    placeholder="Software Developer, DevOps Engineer, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company/Organization
                </label>
                <Input
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Acme Inc, Freelancer, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How did you discover OpenConductor?
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                >
                  <option value="">Select one...</option>
                  <option value="npm-search">Searching npm packages</option>
                  <option value="github">Found on GitHub</option>
                  <option value="reddit">Reddit or other community</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="word-of-mouth">Word of mouth</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Experience with OpenConductor *
                </label>
                <textarea
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                  value={formData.testimonial}
                  onChange={(e) => handleInputChange('testimonial', e.target.value)}
                  placeholder="Tell us what you think about OpenConductor. What problems does it solve for you? How was the installation experience? Would you recommend it to other developers?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleInputChange('rating', rating)}
                      className={`p-1 ${rating <= formData.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.permission}
                    onChange={(e) => handleInputChange('permission', e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    <strong>Permission to use your testimonial:</strong> I give OpenConductor permission to use my feedback in marketing materials, including our Product Hunt launch, website, and social media. You can use my name and company.
                  </span>
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={!formData.name || !formData.testimonial}>
                Submit Feedback
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Your feedback helps us improve OpenConductor and might be featured in our Saturday launch!
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}