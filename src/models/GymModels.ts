// Definicja pojedynczej siłowni
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

// Typ propsów dla komponentu wyświetlającego szczegóły
export interface GymDetailsProps {
    gymId: string;
    onClose: () => void;
}