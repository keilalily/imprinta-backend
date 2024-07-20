let pricingData = {
    longBondPrice: '',
    shortBondPrice: '',
    coloredPrice: '',
    grayscalePrice: '',
    highResolutionPrice: '',
    mediumResolutionPrice: '',
    lowResolutionPrice: ''
  };
  
  const getPricingData = () => {
    return pricingData;
  };
  
  const setPricingData = (newPricingData) => {
    pricingData = newPricingData;
  };
  
  module.exports = {
    getPricingData,
    setPricingData,
  };
  