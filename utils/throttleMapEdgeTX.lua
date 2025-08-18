local logFile = nil
local lastLogTime = 0
local logInterval = 0.1 
local logging = true 
local function init()


  lcd.clear()
 -- Clear again cause it doesnt work sometimes
  lcd.clear()
  

  lcd.drawText(0, 0, "Throttle Mapping")
  lcd.drawText(0, 10, "To begin please set throttle to 100%")
  logFile = io.open("/SCRIPTS/LOGS/throttle_map.csv", "w+")

end

local function run(event)


  if logging then
    lcd.clear()
    lcd.drawText(0, 0, "Throttle " .. getValue("thr"))

    local now = getTime() / 100.0
    if logFile and (now - lastLogTime) >= logInterval then
      local throttle = getValue("thr")
      lcd.drawText(0, 20, "Logging: " .. throttle)
      logFile:write(string.format("%.2f,%d\n", now, throttle))
      lastLogTime = now
    end
  end



  return 0
end

local function stop()
  if logFile then
    logFile:close()
    logFile = nil
  end
end

return { init=init, run=run, stop=stop }
