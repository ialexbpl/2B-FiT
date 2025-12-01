// Definition of a single gym
export interface Gym {
    id: string;
    name: string;
    address: string;
    city: string;
    opening_hours: string;
    open_status?: string;     
    closing_time?: string;   
    phone_number: string;
    description: string;
    website_url?: string;     
    image_url: string | null;
    rating?: number;          
    review_count?: number;   
    category?: string;        
}

// Props type for gym details component
export interface GymDetailsProps {
    gymId: string;
    onClose: () => void;
}