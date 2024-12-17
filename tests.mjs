import { expect } from 'chai';

export const testSpecificThingThatPasses = () => {
  expect(1).to.equal(1);
  expect(() => {
    expect(1).to.equal(2);
  }).to.throw();
}

export const testSpecificThingThatFails = () => {
  expect(1).to.equal(2);
}