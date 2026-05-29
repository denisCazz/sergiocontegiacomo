import Foundation
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count >= 3 else {
    fputs("Usage: heif-to-jpeg.swift <input> <output.jpg> [maxWidth]\n", stderr)
    exit(2)
}

let inputPath = CommandLine.arguments[1]
let outputPath = CommandLine.arguments[2]
let maxWidth = CommandLine.arguments.count > 3 ? Int(CommandLine.arguments[3]) ?? 1600 : 1600

let inputURL = URL(fileURLWithPath: inputPath)
let outputURL = URL(fileURLWithPath: outputPath)

guard let source = CGImageSourceCreateWithURL(inputURL as CFURL, nil) else {
    fputs("heif-to-jpeg: cannot open \(inputPath)\n", stderr)
    exit(1)
}

let decodeOptions: [CFString: Any] = [
    kCGImageSourceShouldAllowFloat: true,
    kCGImageSourceDecodeRequest: kCGImageSourceDecodeToSDR,
]

let thumbOptions: [CFString: Any] = [
    kCGImageSourceThumbnailMaxPixelSize: maxWidth,
    kCGImageSourceCreateThumbnailFromImageAlways: true,
    kCGImageSourceCreateThumbnailWithTransform: true,
    kCGImageSourceShouldCacheImmediately: true,
]

guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, thumbOptions as CFDictionary)
    ?? CGImageSourceCreateImageAtIndex(source, 0, decodeOptions as CFDictionary) else {
    fputs("heif-to-jpeg: cannot decode \(inputPath)\n", stderr)
    exit(1)
}

guard let destination = CGImageDestinationCreateWithURL(
    outputURL as CFURL,
    UTType.jpeg.identifier as CFString,
    1,
    nil
) else {
    fputs("heif-to-jpeg: cannot create destination\n", stderr)
    exit(1)
}

let destOptions: [CFString: Any] = [
    kCGImageDestinationLossyCompressionQuality: 0.88,
]
CGImageDestinationAddImage(destination, image, destOptions as CFDictionary)

guard CGImageDestinationFinalize(destination) else {
    fputs("heif-to-jpeg: write failed\n", stderr)
    exit(1)
}
