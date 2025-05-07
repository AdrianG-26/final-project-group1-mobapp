import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RootStackParamList } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    image: "https://placehold.co/400x300/000000/FFFFFF/png?text=Welcome",
    title: "Welcome to ShoeStore",
    description:
      "Your one-stop shop for the latest and greatest in footwear fashion.",
  },
  {
    id: "2",
    image: "https://placehold.co/400x300/000000/FFFFFF/png?text=Discover",
    title: "Discover Your Style",
    description:
      "Browse through our extensive collection of shoes for every occasion.",
  },
  {
    id: "3",
    image: "https://placehold.co/400x300/000000/FFFFFF/png?text=Shop",
    title: "Shop with Confidence",
    description: "Enjoy secure payments and fast delivery to your doorstep.",
  },
];

const OnboardingScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentSlideIndex + 1,
        animated: true,
      });
    } else {
      navigation.navigate("Auth");
    }
  };

  const handleSkip = () => {
    navigation.navigate("Auth");
  };

  const renderSlide = ({ item }: { item: (typeof slides)[0] }) => {
    return (
      <View style={styles.slide}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentSlideIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentSlideIndex(index);
        }}
      />
      {renderDots()}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentSlideIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  slide: {
    width,
    alignItems: "center",
    padding: 20,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    resizeMode: "contain",
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#000",
    width: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  skipButton: {
    padding: 15,
  },
  skipButtonText: {
    color: "#666",
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: "#000",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default OnboardingScreen;
