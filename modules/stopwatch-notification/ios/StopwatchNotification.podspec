Pod::Spec.new do |s|
  s.name           = 'StopwatchNotification'
  s.version        = '0.1.0'
  s.summary        = 'Stopwatch Live Activity'
  s.description    = 'Stopwatch Live Activity with pause/resume and submit buttons'
  s.license        = 'UNLICENSED'
  s.author         = 'chazarah-tracker'
  s.homepage       = 'https://chazarahtracker.com'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
  s.source_files = "**/*.{h,m,swift}"
end
