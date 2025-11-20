-- Migration: Create user_feedback table for testimonial collection
-- Purpose: Store user testimonials and feedback for launch marketing
-- Created: 2024-11-14

-- Create user_feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    company VARCHAR(255),
    discovery_method VARCHAR(100), -- How they found OpenConductor
    testimonial TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    permission_to_use BOOLEAN NOT NULL DEFAULT false, -- Permission to use in marketing
    featured_candidate BOOLEAN NOT NULL DEFAULT false, -- High-rating testimonials for featuring
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_feedback_rating ON user_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_user_feedback_permission ON user_feedback(permission_to_use);
CREATE INDEX IF NOT EXISTS idx_user_feedback_featured ON user_feedback(featured_candidate);
CREATE INDEX IF NOT EXISTS idx_user_feedback_submitted_at ON user_feedback(submitted_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_user_feedback_updated_at
    BEFORE UPDATE ON user_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_user_feedback_updated_at();

-- Add comments for documentation
COMMENT ON TABLE user_feedback IS 'User testimonials and feedback for marketing and product improvement';
COMMENT ON COLUMN user_feedback.discovery_method IS 'How the user discovered OpenConductor (npm-search, github, reddit, etc.)';
COMMENT ON COLUMN user_feedback.permission_to_use IS 'Whether user gave permission to use their testimonial in marketing materials';
COMMENT ON COLUMN user_feedback.featured_candidate IS 'High-rating testimonials flagged for potential featuring in launch materials';