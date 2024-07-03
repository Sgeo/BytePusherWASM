(module
    (memory $main 257) ;; 16MiB + extra for programs that run off the end
    (memory $video 4) ;; Video data in ImageData format
    (memory $audio 1) ;; Audio data as floats

    (export "main" (memory $main))
    (export "video" (memory $video))
    (export "audio" (memory $audio))

    (func $ptr2addr (param $ptr i32) (result i32)
        ;; Reads 24-bit value pointed at by $ptr.
        local.get $ptr
        i32.load8_u
        i32.const 16
        i32.shl
        local.get $ptr
        i32.const 1
        i32.add
        i32.load8_u
        i32.const 8
        i32.shl
        i32.or
        local.get $ptr
        i32.const 2
        i32.add
        i32.load8_u
        i32.or
    )

    (func $runInst (param $pc i32) (result i32) ;; Inputs a PC, outputs new PC
        local.get $pc
        i32.const 3
        i32.add
        call $ptr2addr
        local.get $pc
        call $ptr2addr
        i32.const 1
        memory.copy
        local.get $pc
        i32.const 6
        i32.add
        call $ptr2addr
    )

    (func $frame
        (local $i i32)
        (local $pc i32)
        i32.const 2
        call $ptr2addr
        local.set $pc
        (loop $innerLoop
            local.get $pc
            call $runInst
            local.set $pc

            local.get $i
            i32.const 1
            i32.add
            local.tee $i
            i32.const 65536
            i32.lt_u
            br_if $innerLoop
        )
        call $convertVideo
        call $convertAudio
    )

    (func $convertVideo
        (local $i i32)
        (local $vidAddr i32)
        (local $curPixel i32)
        i32.const 5
        i32.load8_u
        i32.const 16
        i32.shl
        local.set $vidAddr
        (loop $convertLoop
            local.get $vidAddr
            local.get $i
            i32.add
            i32.load8_u
            local.tee $curPixel
            i32.const 216
            i32.ge_u
            (if
                (then
                    i32.const 0
                    local.set $curPixel
                )
            )

            local.get $i ;; For the store8
            i32.const 4
            i32.mul
            local.get $curPixel
            i32.const 36 ;; red
            i32.div_u
            i32.const 51 ;; 0x33
            i32.mul
            i32.store8 (memory $video)
            local.get $i
            i32.const 4
            i32.mul
            i32.const 1
            i32.add ;; green address in $video
            local.get $curPixel
            i32.const 36 ;; Remove red
            i32.rem_u
            i32.const 6
            i32.div_u
            i32.const 51
            i32.mul
            i32.store8 (memory $video)
            local.get $i
            i32.const 4
            i32.mul
            i32.const 2
            i32.add
            local.get $curPixel
            i32.const 6
            i32.rem_u
            i32.const 51
            i32.mul
            i32.store8 (memory $video)

            local.get $i
            i32.const 4
            i32.mul
            i32.const 3
            i32.add
            i32.const 255
            i32.store8 (memory $video)

            local.get $i
            i32.const 1
            i32.add
            local.tee $i
            i32.const 65536
            i32.lt_s
            br_if $convertLoop ;; Loop 0-65535

        )
    )

        (func $convertAudio
            (local $i i32)
            (local $audioAddr i32)
            i32.const 6
            i32.load8_u
            i32.const 16
            i32.shl
            i32.const 7
            i32.load8_u
            i32.const 8
            i32.shl
            i32.or
            local.set $audioAddr

            (loop $convertLoop
                local.get $i
                i32.const 4
                i32.mul
                local.get $audioAddr
                local.get $i
                i32.or
                i32.load8_s
                f32.convert_i32_s
                f32.const 256
                f32.div
                f32.store (memory $audio)

                local.get $i
                i32.const 1
                i32.add
                local.tee $i
                i32.const 256
                i32.lt_s
                br_if $convertLoop
            )
        )

    (export "frame" (func $frame))
)