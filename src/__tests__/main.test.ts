import { mocked } from "ts-jest/utils"
import { getInput, InputOptions, setFailed } from "@actions/core"
import XcutilsVersionResolver from "../XcutilsVersionResolver"
import applyXcodeVersionsFile from "../applyXcodeVersionsFile"
import path from "path"
import { run } from "../main"
jest.mock("@actions/core")
jest.mock("../XcutilsVersionResolver", () => {
  return jest.fn().mockImplementation((xcodeSearchPath) => {
    return {
      // eslint-disable-next-line require-await
      resolveVersion: async (): Promise<string> => {
        return ""
      },
    }
  })
})
jest.mock("../applyXcodeVersionsFile")
const mockedGetInput = mocked(getInput, true)
const mockedSetFailed = mocked(setFailed, true)
const mockedXcutilsVersionResolver = mocked(XcutilsVersionResolver, true)
const mockedApplyXcodeVersionsFile = mocked(applyXcodeVersionsFile, true)

const initialEnv = Object.assign({}, process.env)

afterEach(() => {
  mockedGetInput.mockReset()
  mockedSetFailed.mockReset()
  mockedXcutilsVersionResolver.mockReset()
  mockedApplyXcodeVersionsFile.mockReset()

  process.env = Object.assign({}, initialEnv)
})

test("valid inputs and environment", async () => {
  const workspace = "/workspace"
  process.env.GITHUB_WORKSPACE = workspace
  const xcodeVersionsFile = "path/to/xcode-versions-file.yml"
  const resolvedXcodeVersionsFile = path.resolve(workspace, xcodeVersionsFile)
  mockedGetInput.mockImplementation(
    (name: string, options?: InputOptions): string => {
      switch (name) {
        case "xcode-versions-file":
          return xcodeVersionsFile
        case "xcode-search-path":
          return "/Users/tester/Applications"
        case "xcode-version-badge-path":
          return ""
        case "xcode-version-badge-markdown-file":
          return ""
        case "quotes":
          return "double"
        default:
          throw new Error(`Unknown input requested: ${name}`)
      }
    }
  )

  await run()

  expect(mockedXcutilsVersionResolver).toBeCalledWith(
    "/Users/tester/Applications"
  )
  expect(mockedApplyXcodeVersionsFile).toBeCalledWith(
    resolvedXcodeVersionsFile,
    expect.anything(),
    "double"
  )
  expect(mockedApplyXcodeVersionsFile).toBeCalledTimes(1)
  expect(mockedGetInput).toBeCalledWith("xcode-versions-file", {
    required: true,
  })
  expect(mockedGetInput).toBeCalledWith("xcode-search-path")
  expect(mockedGetInput).toBeCalledWith("xcode-version-badge-path")
  expect(mockedGetInput).toBeCalledWith("xcode-version-badge-markdown-file")
  expect(mockedGetInput).toBeCalledWith("github-token")
  expect(mockedGetInput).toBeCalledWith("quotes")
})

test("no xcode-search-path", async () => {
  const workspace = "/workspace"
  process.env.GITHUB_WORKSPACE = workspace
  const xcodeVersionsFile = "path/to/xcode-versions-file.yml"
  const resolvedXcodeVersionsFile = path.resolve(workspace, xcodeVersionsFile)
  mockedGetInput.mockImplementation(
    (name: string, options?: InputOptions): string => {
      switch (name) {
        case "xcode-versions-file":
          return xcodeVersionsFile
        case "xcode-search-path":
          return ""
        case "xcode-version-badge-path":
          return ""
        case "xcode-version-badge-markdown-file":
          return ""
        case "quotes":
          return "double"
        default:
          throw new Error(`Unknown input requested: ${name}`)
      }
    }
  )

  await run()

  expect(mockedXcutilsVersionResolver).toBeCalledWith("/Applications")
  expect(mockedApplyXcodeVersionsFile).toBeCalledWith(
    resolvedXcodeVersionsFile,
    expect.anything(),
    "double"
  )
  expect(mockedApplyXcodeVersionsFile).toBeCalledTimes(1)
  expect(mockedGetInput).toBeCalledWith("xcode-versions-file", {
    required: true,
  })
  expect(mockedGetInput).toBeCalledWith("xcode-search-path")
  expect(mockedGetInput).toBeCalledWith("xcode-version-badge-path")
  expect(mockedGetInput).toBeCalledWith("xcode-version-badge-markdown-file")
  expect(mockedGetInput).toBeCalledWith("github-token")
  expect(mockedGetInput).toBeCalledWith("quotes")
})

test("missing GITHUB_WORKSPACE environment variable", async () => {
  delete process.env.GITHUB_WORKSPACE

  await run()

  expect(mockedSetFailed).toBeCalledTimes(1)
  expect(mockedSetFailed).toBeCalledWith(
    "GITHUB_WORKSPACE environment variable not available"
  )
})

test("applyXcodeVersionsFile throwing an error", async () => {
  const workspace = "/workspace"
  process.env.GITHUB_WORKSPACE = workspace
  const xcodeVersionsFile = "path/to/xcode-versions-file.yml"
  const resolvedXcodeVersionsFile = path.resolve(workspace, xcodeVersionsFile)
  mockedGetInput.mockImplementation(
    (name: string, options?: InputOptions): string => {
      switch (name) {
        case "xcode-versions-file":
          return xcodeVersionsFile
        case "xcode-search-path":
          return "/Users/tester/Applications"
        case "quotes":
          return "single"
        default:
          throw new Error(`Unknown input requested: ${name}`)
      }
    }
  )
  const testError = new Error("An error thrown by the tests")
  mockedApplyXcodeVersionsFile.mockRejectedValue(testError)

  await run()

  expect(mockedSetFailed).toBeCalledTimes(1)
  expect(mockedSetFailed).toBeCalledWith(testError.message)

  expect(mockedXcutilsVersionResolver).toBeCalledWith(
    "/Users/tester/Applications"
  )
  expect(mockedApplyXcodeVersionsFile).toBeCalledWith(
    resolvedXcodeVersionsFile,
    expect.anything(),
    "single"
  )
  expect(mockedApplyXcodeVersionsFile).toBeCalledTimes(1)
  expect(mockedGetInput).toBeCalledWith("xcode-versions-file", {
    required: true,
  })
  expect(mockedGetInput).toBeCalledWith("xcode-search-path")
  expect(mockedGetInput).toBeCalledWith("quotes")
  expect(mockedGetInput).toBeCalledTimes(3)
})
