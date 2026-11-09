// Simulated catalogue. `granted` may include extras to demo over-permissioned apps.
module.exports = [
  { name: 'Calculator',      category: 'utility',      expected: ['storage'],                                     granted: ['storage'] },
  { name: 'Flashlight Plus', category: 'utility',      expected: ['camera'],                                      granted: ['camera', 'location'] },
  { name: 'Camera Studio',   category: 'photography',  expected: ['camera', 'storage', 'location'],               granted: ['camera', 'storage', 'location'] },
  { name: 'City Maps',       category: 'navigation',   expected: ['location', 'storage'],                         granted: ['location', 'storage'] },
  { name: 'ChatBox',         category: 'messaging',    expected: ['contacts', 'camera', 'microphone', 'storage'], granted: ['contacts', 'camera', 'microphone', 'storage'] },
  { name: 'Daily Notes',     category: 'productivity', expected: ['storage'],                                     granted: ['storage'] },
];
