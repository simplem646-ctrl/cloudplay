// Opening hours and closed days of every interior. Times may exceed 24:00.
const ALWAYS = '30:00';

export default {
  cottage: {
    open: '00:00', close: ALWAYS, closedDays: [],
    closedText: 'The cottage is always open to you. Home sweet home.',
  },
  workshop: {
    open: '06:00', close: '26:00', closedDays: [], lockFlag: 'workshop_unlocked',
    closedText: 'The workshop is closed for the night.',
    lockedText: "The workshop door is locked tight. It is Tobias' old workshop, and the key is somewhere in town.",
  },
  bakery: {
    open: '07:00', close: '17:00', closedDays: ['sun'],
    closedText: 'Rye & Rose is closed. A note on the door says: "Back with fresh bread soon. Do not knock, the oven is asleep. - R."',
  },
  cafe: {
    open: '10:00', close: '20:00', closedDays: ['mon'],
    closedText: 'The Copper Kettle is closed. A neat card in the window reads: "Closed. Tea is not an emergency. - R.M."',
  },
  town_hall: {
    open: '09:00', close: '16:00', closedDays: ['sat', 'sun'],
    closedText: 'The Town Hall is closed. The Mayor has gone for a stroll, probably to find a good pun.',
  },
  general_store: {
    open: '09:00', close: '18:00', closedDays: ['wed'],
    closedText: 'Pennywhistle Provisions is closed today. A sign says: "Gone to count my pennies. Back soon! - B.P."',
  },
  clinic: {
    open: '09:00', close: '17:00', closedDays: ['sun'],
    closedText: 'The clinic is closed. A note says: "For emergencies, knock loudly. For everything else, rest and drink water."',
  },
  library: {
    open: '10:00', close: '18:00', closedDays: ['tue'],
    closedText: 'Thornfield Library is closed. A small sign: "Books are resting. Please be quiet outside, too."',
  },
  inn: {
    open: '10:00', close: '22:00', closedDays: [],
    closedText: 'The Heron Inn is shut for the night. A lamp glows upstairs, but the door is locked.',
  },
  fishing_hut: {
    open: '06:00', close: '18:00', closedDays: ['thu'],
    closedText: "Pelham's Fishing Hut is closed. The sign says: \"Gone fishing. For real this time. - Capt. P.\"",
  },
  observatory: {
    open: '16:00', close: '27:00', closedDays: [],
    closedText: 'The observatory opens at four in the afternoon. A star is painted on the door, with the words: "Come after the sun."',
  },
};
