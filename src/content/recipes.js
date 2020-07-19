import {range, exact} from './quantity';
import {hours, minutes, seconds} from './duration';

export const RECIPES = [{
    id: 'pain-de-campagne',
    name: 'Pain de campagne',
    methodSteps: [
        {
            id: 1,
            title: 'Set the leaven',
            duration: range(hours(2), hours(4)),
            ingredients: [
                // TODO: as structured quantities to allow adapting quantities
                '30g sourdough starter',
                '15g strong white flour',
                '15g wholemeal flour',
                '40ml water at 30°C',
            ],
        },
        {
            id: 2,
            title: 'Mix in the flour and water',
            duration: exact(hours(1)),
            ingredients: [
                '100g leaven',
                '500g strong white flour',
                '400ml water at 30°C',
            ],
        },
        {
            id: 3,
            title: 'Pinch in the salt',
            duration: exact(minutes(30)),
        },
        {
            id: 4,
            title: 'First fold',
            duration: exact(minutes(30)),
        },
        {
            id: 5,
            title: 'Second fold',
            duration: exact(minutes(30)),
        },
        {
            id: 6,
            title: 'Third fold',
            duration: exact(minutes(90)),
        },
        {
            id: 7,
            title: 'First shaping',
            duration: range(minutes(15), minutes(25)),
        },
        // bench rest
        {
            id: 8,
            title: 'Final shaping',
            duration: range(hours(1), hours(2)),
        },
        // basket proving
        {
            id: 9,
            title: 'Cold proving',
            duration: range(hours(12), hours(36)),
        },
        {
            id: 10,
            title: 'Baking',
            // TODO: 2x 20 minutes
            duration: exact(minutes(40)),
        },
    ],
}];
