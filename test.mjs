
const passingHardcodedAutomationId = './tests.mjs:testSpecificThingThatPasses';
const failingHardcodedAutomationId = './tests.mjs:testSpecificThingThatFails';

describe('demo', () => {
  it('should run a test that passes', async () => {
    const [filePath, fn] = passingHardcodedAutomationId.split(':');
    const file = await import(filePath);
    file[fn]();
  });
  it('should run a test that fails', async () => {
    const [filePath, fn] = failingHardcodedAutomationId.split(':');
    const file = await import(filePath);
    file[fn]();
  });
});
