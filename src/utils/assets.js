export const localAssets = {
  logo: require('../../assets/logo_transparent.png'),
  logoSquare: require('../../assets/logo.jpg'),
  stadium: require('../../assets/stadium.jpg'),
  batsman: require('../../assets/batsman.jpg'),
  champions: require('../../assets/champions.jpg'),
  watermark: require('../../assets/watermark.png'),
};

export function getAsset(key) {
  return localAssets[key] || localAssets.logo;
}
