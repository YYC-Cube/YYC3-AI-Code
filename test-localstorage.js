console.log('Testing localStorage...');

if (typeof localStorage !== 'undefined') {
  console.log('localStorage exists:', typeof localStorage);
  console.log('localStorage.setItem:', typeof localStorage.setItem);
  console.log('localStorage.getItem:', typeof localStorage.getItem);
  console.log('localStorage.clear:', typeof localStorage.clear);

  try {
    localStorage.setItem('test', 'value');
    console.log('setItem works');
    console.log('getItem result:', localStorage.getItem('test'));
  } catch (err) {
    console.error('setItem error:', err.message);
  }
} else {
  console.log('localStorage does not exist');
}
