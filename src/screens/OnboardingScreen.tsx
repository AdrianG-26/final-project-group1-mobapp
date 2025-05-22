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
import { RootStackParamList } from "../types/index";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    image: require('../../assets/slide1.webp'),
    title: "Start your journey with",
    titleLogo: true,
    description: " ",
  },
  {
    id: "2",
    image: require('../../assets/slide2.avif'),
    title: "Step into your style",
    description: "Discover the perfect pair that defines you.",
  },
  {
    id: "3",
    image: require('../../assets/slide3.jpg'),
    title: "Perform at your peak",
    description: "Shoes for any sports who demand excellence in every step.",
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
        <View style={styles.imageContainer}>
          <Image 
            source={item.image} 
            style={styles.image}
            resizeMethod="resize"
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{item.title}</Text>
          {item.titleLogo && (
            <Image 
              source={require('../../assets/shoepapi_logo.png')} 
              style={styles.titleLogo}
            />
          )}
        </View>
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
    backgroundColor: '#fff',
  },
  slide: {
    width,
    height: '100%',
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 140,
  },
  imageContainer: {
    width: 300,
    height: 300,
    marginBottom: 40,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: "cover",
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
  },
  titleContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    textAlign: "left",
    lineHeight: 38,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "left",
    lineHeight: 24,
    width: '100%',
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
  titleLogo: {
    width: '100%',
    height: 60,
    resizeMode: 'center',
  },
});

export default OnboardingScreen;
