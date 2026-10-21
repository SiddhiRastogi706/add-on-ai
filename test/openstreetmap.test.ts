import {
  buildOverpassQuery,
  mapElementToCompetitor,
  mapNominatimResultToCompetitor,
} from '../src/server/services/openstreetmap.service';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

const mappedBusiness = mapElementToCompetitor(
  {
    type: 'way',
    id: 123,
    center: { lat: 19.076, lon: 72.8777 },
    tags: {
      name: 'Example Dental Clinic',
      amenity: 'dentist',
      'addr:street': 'MG Road',
      'addr:city': 'Mumbai',
      website: 'https://example.test',
    },
  },
  19.07,
  72.87
);

assert(mappedBusiness !== null, 'maps a real OSM element with a name and coordinates');
assert(mappedBusiness?.osmId === 'way/123', 'preserves the OpenStreetMap element reference');
assert(mappedBusiness?.category === 'dentist', 'shows the actual mapped OSM category');
assert(mappedBusiness?.address === 'MG Road, Mumbai', 'uses only address fields present in OSM');
assert(mappedBusiness?.website === 'https://example.test', 'preserves a mapped HTTP website');
assert(
  mappedBusiness?.distanceKm === 1,
  'calculates approximate distance from the selected map center'
);
assert(
  mapElementToCompetitor({ type: 'node', id: 8, lat: 1, lon: 2 }, 1, 2) === null,
  'does not invent names for unnamed map elements'
);
assert(
  mapElementToCompetitor(
    { type: 'node', id: 9, lat: 1, lon: 2, tags: { name: 'Without website' } },
    1,
    2
  )?.website === null,
  'reports website as unavailable when it is not mapped'
);

const nominatimBusiness = mapNominatimResultToCompetitor(
  {
    lat: '19.076',
    lon: '72.8777',
    display_name: 'Example Logistics, Mumbai, India',
    osm_type: 'way',
    osm_id: 456,
    type: 'logistics',
    name: 'Example Logistics',
    address: { road: 'MG Road', city: 'Mumbai' },
    extratags: { website: 'https://logistics.example.test' },
  },
  19.07,
  72.87
);
assert(nominatimBusiness?.name === 'Example Logistics', 'maps a named Nominatim fallback result');
assert(nominatimBusiness?.osmId === 'way/456', 'preserves the Nominatim OSM record reference');
assert(nominatimBusiness?.address === 'MG Road, Mumbai', 'maps the Nominatim address fields');
assert(
  nominatimBusiness?.website === 'https://logistics.example.test',
  'preserves a mapped Nominatim website'
);
assert(
  mapNominatimResultToCompetitor(
    { lat: '1', lon: '2', display_name: 'Unnamed result' },
    1,
    2
  ) === null,
  'does not invent names or OSM references for Nominatim results'
);

const mappedCategoryQuery = buildOverpassQuery('dentist', 19.076, 72.8777);
assert(
  mappedCategoryQuery.includes('["amenity"="dentist"]'),
  'uses the OSM dentist category filter'
);
assert(
  buildOverpassQuery('truck transport', 19, 72).includes('["office"="logistics"]'),
  'maps common logistics searches to OSM business tags'
);
assert(
  buildOverpassQuery('Truck mitra', 19, 72).includes('["office"="transport"]'),
  'maps the Truck Mitra business name to transport listings instead of a broad name query'
);
assert(
  buildOverpassQuery('clinic"]->.x;out;', 19, 72).includes('clinic\\"]->.x;out;'),
  'escapes user-supplied quotes in a name search query'
);

console.log('OpenStreetMap competitor tests passed.');
