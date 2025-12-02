import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

import { Rating } from '@/api/appEntities';
import { webhookDispatcher } from "@/api/functions";

export default function RatingForm({ ride, onSubmit }) {
  const [ratings, setRatings] = useState({
    rating: 0,
    service_quality: 0,
    punctuality: 0,
    vehicle_condition: 0,
    comments: '',
    would_recommend: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const StarRating = ({ value, onChange, label }) => (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`transition-all duration-200 ${
              star <= value
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
          >
            <Star className="w-7 h-7 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (ratings.rating === 0) {
        toast.error('Please provide an overall rating');
        setIsSubmitting(false);
        return;
      }

      const ratingData = {
        ride_id: ride.id,
        driver_id: ride.assigned_driver,
        vehicle_id: ride.vehicle_number,
        guest_phone: ride.guest_phone,
        rating: ratings.rating,
        service_quality: ratings.service_quality,
        punctuality: ratings.punctuality,
        vehicle_condition: ratings.vehicle_condition,
        comments: ratings.comments.trim(),
        would_recommend: ratings.would_recommend,
        flagged_for_review: ratings.rating <= 2
      };

      console.log('Submitting rating:', ratingData);
      const newRating = await Rating.create(ratingData);
      
      // 🔔 TRIGGER WEBHOOK: rating.submitted
      try {
        await webhookDispatcher({
          event: 'rating.submitted',
          data: {
            rating_id: newRating.id,
            ride_id: ride.id,
            ride_code: ride.ride_code,
            driver_id: ride.assigned_driver,
            vehicle_id: ride.vehicle_number,
            rating: ratings.rating,
            service_quality: ratings.service_quality,
            punctuality: ratings.punctuality,
            vehicle_condition: ratings.vehicle_condition,
            would_recommend: ratings.would_recommend,
            flagged_for_review: ratings.rating <= 2,
            submitted_at: newRating.created_date
          }
        });
        console.log('✅ Webhook triggered for rating.submitted');
      } catch (webhookError) {
        console.warn('⚠️ Webhook trigger failed (non-critical):', webhookError);
      }
      
      toast.success('Thank you for your feedback!', {
        description: 'Your rating helps us improve our service.',
        duration: 5000
      });

      if (onSubmit) {
        onSubmit(newRating);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg bg-white border border-gray-200 rounded-lg">
      <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-t-lg p-6">
        <CardTitle className="text-2xl font-bold text-center">Rate Your Experience</CardTitle>
        <p className="text-blue-100 text-center text-sm mt-1">Your feedback helps us improve our service</p>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <form onSubmit={handleSubmit}>
          <div className="text-center">
            <StarRating
              value={ratings.rating}
              onChange={(value) => setRatings(prev => ({...prev, rating: value}))}
              label="Overall Experience"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <StarRating
              value={ratings.service_quality}
              onChange={(value) => setRatings(prev => ({...prev, service_quality: value}))}
              label="Service Quality"
            />
            <StarRating
              value={ratings.punctuality}
              onChange={(value) => setRatings(prev => ({...prev, punctuality: value}))}
              label="Punctuality"
            />
            <StarRating
              value={ratings.vehicle_condition}
              onChange={(value) => setRatings(prev => ({...prev, vehicle_condition: value}))}
              label="Vehicle Condition"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-semibold text-gray-700">
              Would you recommend our shuttle service?
            </Label>
            <div className="flex gap-4 justify-center">
              <Button
                type="button"
                variant={ratings.would_recommend === true ? "default" : "outline"}
                onClick={() => setRatings(prev => ({...prev, would_recommend: true}))}
                className={`flex items-center gap-2 px-6 py-2 transition-colors duration-200 ${
                  ratings.would_recommend === true ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                Yes
              </Button>
              <Button
                type="button"
                variant={ratings.would_recommend === false ? "default" : "outline"}
                onClick={() => setRatings(prev => ({...prev, would_recommend: false}))}
                className={`flex items-center gap-2 px-6 py-2 transition-colors duration-200 ${
                  ratings.would_recommend === false ? "bg-red-600 hover:bg-red-700 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                No
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments" className="text-sm font-semibold text-gray-700">
              Additional Comments (Optional)
            </Label>
            <Textarea
              id="comments"
              placeholder="Share your experience, suggestions for improvement, or compliments..."
              value={ratings.comments}
              onChange={(e) => setRatings(prev => ({...prev, comments: e.target.value}))}
              className="h-32 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white font-semibold py-2.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}