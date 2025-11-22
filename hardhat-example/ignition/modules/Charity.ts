import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CharityModule", (m) => {
  const charity = m.contract("Charity");

  // Optionally create an initial campaign from admin (example)
  // m.call(charity, "createCampaign", ["Title", "Desc", "ipfs://...", "Hanoi", 1000000000000000000n, null]);

  return { charity };
});
