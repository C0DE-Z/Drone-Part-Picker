local time = 0
local armed = false
local logFile = "throttleMap.csv"

local inputs = { "Thr", "Ail", "Ele", "Rud", "SA", "SB", "SC", "SD" }

local function anyInputActive()
    for i = 1, #inputs do
        local val = getValue(inputs[i])
        if val ~= 0 then
            return true
        end
    end
    return false
end

function init()
    return
end

function run()
    if anyInputActive() then
        if not armed then
            armed = true
            time = 0
            io.open(logFile, "a")
        end

        lcd.clear()
        local thr = getValue("Thr")
        lcd.drawText(LCD_W/2 - 20, LCD_H/2 - 20, "ARMED", MIDSIZE)
        lcd.drawNumber(LCD_W/2, LCD_H/2, thr)
        lcd.drawNumber(LCD_W/2, LCD_H/2 + 20, time)

        io.write(logFile, time .. "," .. thr .. "\n")
        time = time + 1

    else
        if armed then
            armed = false
            io.close()
        end

        lcd.clear()
        lcd.drawText(LCD_W/2 - 40, LCD_H/2 - 10, "Move any input to start")
    end
end

return {
    init = init,
    run = run
}
