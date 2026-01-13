export interface Property {
    _id: string;
    title: string;
    description: string;
    price: number;
    location: string;
    type: 'Sale' | 'Rent';
    imageUrl: string;
    images: string[];
    features: string[];
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
}
