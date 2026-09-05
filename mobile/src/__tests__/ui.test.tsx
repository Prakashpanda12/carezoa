import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Button, Chip } from "../components/ui";

describe("ui atoms", () => {
  it("Button renders its title and fires onPress", () => {
    const onPress = jest.fn();
    render(<Button title="Book now" onPress={onPress} testID="btn" />);
    fireEvent.press(screen.getByTestId("btn"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Book now")).toBeTruthy();
  });

  it("Button does not fire while disabled", () => {
    const onPress = jest.fn();
    render(<Button title="Pay" onPress={onPress} disabled testID="pay" />);
    fireEvent.press(screen.getByTestId("pay"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("Button shows a spinner instead of the title while loading", () => {
    render(<Button title="Pay" loading onPress={() => {}} />);
    expect(screen.queryByText("Pay")).toBeNull();
  });

  it("Chip renders a label", () => {
    render(<Chip label="Confirmed" />);
    expect(screen.getByText("Confirmed")).toBeTruthy();
  });
});
